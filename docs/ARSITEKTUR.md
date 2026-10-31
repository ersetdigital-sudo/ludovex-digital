# Arsitektur Dashboard PPOB Multi-Brand

Status: keputusan final Tahap 1. Dokumen ini wajib dibaca sebelum mengerjakan tahap berikutnya.

## 1. Posisi repo dan modul

- Ada 22 website PPOB Next.js (sebagian punya kategori top up game). Setiap website punya repo, desain, dan pemilik sendiri.
- Dashboard admin ada di dalam repo web masing-masing, di route `/admin` (contoh: `ludovexdigital.com/admin`).
- `ludovex-digital` adalah **repo master**. Kode dashboard dibangun di sini sebagai satu modul mandiri di folder `admin/` (bukan di `components/` atau `lib/` milik web). File di `app/admin` hanya pintu masuk tipis yang mengimpor modul tersebut.
- Modul dashboard yang sama disalin ke repo brand lain **tanpa perubahan kode**. Brand aktif dibaca dari env `BRAND_SLUG` dan dicocokkan dengan `brands.slug`.
- Semua brand memakai **satu project Supabase**. Data dipisah dengan `brand_id`.
- File migration Supabase hanya ada di repo master (`supabase/migrations/`). Repo brand tidak boleh membuat migration sendiri.
- Role:
  - `owner` dan `admin`: terikat satu brand (`admins.brand_id`).
  - `super_admin`: developer, `brand_id = null`, bisa akses semua brand, dan tidak ditampilkan di daftar admin brand.
- Pembayaran manual: pembeli bayar QRIS/transfer, kirim bukti lewat WA, admin mengubah status. Belum ada payment gateway atau API provider.
- Layanan tagihan (PDAM, BPJS, Internet & TV, Multifinance, dan tagihan sejenis) dicek manual oleh admin dan **tidak dibatalkan otomatis**. Di Ludovex, layanan `pln` saat ini adalah Token PLN (nominal); tagihan PLN untuk brand lain ditambahkan saat brand tersebut dikerjakan.
- Service role key Supabase tidak boleh dipakai di sisi browser.
- Acuan desain dashboard: `docs/mockup.html`.

## 2. Alur status order

```
Nominal : menunggu_bayar -> sudah_bayar -> sukses
Tagihan : menunggu_cek -> (admin isi nominal + denda) -> menunggu_bayar -> sudah_bayar -> sukses
Batal   : menunggu_cek | menunggu_bayar | sudah_bayar -> dibatalkan
```

- `menunggu_bayar` otomatis menjadi `dibatalkan` jika melewati `expires_at`.
- `menunggu_cek` tidak pernah batal otomatis.
- `expires_at` diisi saat order masuk `menunggu_bayar`: `now() + brands.batas_bayar_menit`.
- Status `sukses` wajib memiliki `sn` (SN, token, atau nomor struk).
- Perpindahan status hanya lewat `update_order_status` dan `set_bill_amount`, dan setiap perubahan masuk `order_logs`.

## 3. Tabel

Semua tabel data memiliki `brand_id`, `created_at`, `updated_at` (kecuali `brands` yang memang tabel induk; `created_at`/`updated_at` tetap ada). Semua uang memakai `numeric(14,2)`.

### brands
Identitas dan aturan transaksi: `nama`, `slug`, `domain`, `tagline`, `logo_url`, `warna_utama`, `kode_ref`, `wa_cs`, `qris_image_url`, `batas_bayar_menit` (default 15), `maks_order_pending` (default 3), `jam_cek_tagihan`.

### admins
`user_id` (FK `auth.users`), `brand_id` (null untuk super_admin), `nama`, `role` (`owner`/`admin`/`super_admin`), `aktif`.

### services
`nama`, `slug` (unik per brand), `jenis` (`nominal`/`tagihan`), `input_fields` (jsonb array), `biaya_admin`, `biaya_supplier` (khusus tagihan), `urutan`, `aktif`.

Format `input_fields` mendukung lebih dari satu kolom (contoh game):

```json
[
  { "key": "user_id", "label": "User ID", "placeholder": "12345678", "wajib": true },
  { "key": "zone_id", "label": "Zone ID", "placeholder": "1234", "wajib": true }
]
```

### products
Khusus layanan nominal: `service_id`, `nama`, `harga_modal`, `harga_jual`, `urutan`, `aktif`.

### payment_methods
`nama`, `tipe` (`qr`/`ewallet`/`va`), `biaya_admin`, `urutan`, `aktif`.

### vouchers
`kode` (unik per brand, selalu huruf besar), `jenis` (`persen`/`tetap`), `nilai`, `maks_potongan`, `min_transaksi`, `service_ids` (array uuid; kosong = semua layanan), `berlaku_sampai` (opsional), `aktif`.

### orders
- Identitas: `ref` (unik), `service_id`, `product_id` (null untuk tagihan).
- Snapshot: `nama_layanan`, `nama_produk`, `harga_modal`, `harga_jual`.
- Pembeli: `input_pembeli` (jsonb), `nomor_tujuan`, `wa_pembeli` (wajib untuk tagihan).
- Tagihan: `nominal_tagihan`, `denda`.
- Pembayaran: `payment_method_id`, `metode_bayar` (snapshot nama), `biaya_admin`, `voucher_kode`, `potongan`, `total`. Untuk tagihan, `biaya_admin` adalah gabungan biaya metode + `services.biaya_admin`; untuk nominal hanya biaya metode.
- Status: `status`, `sn`.
- Waktu: `expires_at`, `checked_at`, `paid_at`, `completed_at`, `cancelled_at`, `cancel_reason`.

Rumus uang:

```
Nominal : total = harga_jual + biaya_admin metode - potongan
Tagihan : base = nominal_tagihan + denda
          admin = biaya_admin metode + services.biaya_admin
          harga_jual = base
          harga_modal = nominal_tagihan + services.biaya_supplier
          total = base + admin - potongan
```

`potongan` dihitung di database dan tidak pernah melebihi subtotal (`harga_jual`).

### order_logs
`order_id`, `status_dari` (null saat order dibuat), `status_ke`, `catatan`, `admin_id` (null jika sistem), `created_at`.

## 4. Function (RPC)

Semua hitungan uang dilakukan di database. Angka dari browser tidak dipercaya.

### Publik (anon + authenticated)

| Function | Hasil | Keterangan |
|---|---|---|
| `create_order(p_brand_slug, p_service_id, p_product_id, p_nomor_tujuan, p_input, p_payment_method_id, p_voucher_kode)` | `{ref, total, expires_at}` | Layanan nominal. Validasi produk/metode/voucher, hitung total, batas pending, isi `expires_at`. |
| `create_bill_check(p_brand_slug, p_service_id, p_nomor_tujuan, p_input, p_wa_pembeli, p_payment_method_id, p_voucher_kode)` | `{ref, jam_cek_tagihan}` | Membuat order tagihan berstatus `menunggu_cek`. |
| `get_payment(p_ref)` | objek pembayaran | Total, metode, QRIS, `expires_at`, status. Untuk link bayar yang dikirim admin via WA. |
| `cek_voucher(p_brand_slug, p_kode, p_service_id, p_subtotal)` | `{valid, potongan, pesan}` | Preview satu kode voucher. Tidak pernah membocorkan daftar voucher. |
| `cek_order(p_brand_slug, p_ref, p_nomor_tujuan)` | array order aman | Cari per ref atau nomor. Nomor disamarkan. Sekaligus membatalkan order `menunggu_bayar` yang kedaluwarsa. |

### Admin brand / super_admin (authenticated)

| Function | Hasil | Keterangan |
|---|---|---|
| `set_bill_amount(p_order_id, p_nominal_tagihan, p_denda)` | `{ref, total, expires_at}` | Isi tagihan + denda, hitung total, ubah ke `menunggu_bayar`, isi `expires_at`. |
| `update_order_status(p_order_id, p_status, p_sn, p_catatan)` | data status baru | Mengikuti alur status. `sn` wajib untuk `sukses`. Otomatis menulis `order_logs`. |
| `dashboard_summary(p_brand_id, p_bulan)` | objek ringkasan | Omzet, modal, potongan voucher, net profit, jumlah transaksi, rata-rata, persentase batal, layanan terlaris, jumlah `menunggu_cek` dan `sudah_bayar`. |

### Internal
`cancel_expired_orders`, `next_order_ref`, `hitung_potongan_voucher`, `validasi_input`, `mask_nomor`, `is_super_admin`, `is_brand_admin`, `is_brand_owner`, `storage_brand_id`.

Pembatalan otomatis: `pg_cron` memanggil `cancel_expired_orders()` tiap menit (jika pg_cron tersedia), ditambah pengecekan di `get_payment` dan `cek_order`.

## 5. RLS dan akses

- **anon (publik)**
  - Hanya boleh membaca kolom publik `brands` (tanpa `kode_ref`), `services` aktif (tanpa `biaya_supplier`), `products` aktif (tanpa `harga_modal`), dan `payment_methods` aktif.
  - Tidak boleh membaca `orders`, `order_logs`, `vouchers`, dan `admins` secara langsung. Semua lewat function.
- **authenticated (admin)**
  - Hanya bisa membaca dan mengubah data brand-nya sendiri.
  - `super_admin` bisa semua brand.
  - `orders` dan `order_logs` hanya bisa dibaca langsung; perubahan wajib lewat RPC agar tercatat.
  - Brand admin tidak bisa melihat admin brand lain, dan super_admin tidak muncul di daftar admin brand.
- **service_role**
  - Hanya untuk server-side bila benar-benar perlu. Tidak boleh masuk bundle browser dan tidak memakai prefix `NEXT_PUBLIC_`.
- Publik tidak pernah mendapat `kode_ref`, `harga_modal`, atau `biaya_supplier`.
- Public signup Supabase harus dimatikan. Akun admin dibuat manual.

## 6. Storage

- Bucket publik: `brand-logos` dan `brand-qris`.
- Path wajib: `<brand_id>/<nama-file>`.
- Publik boleh melihat gambar.
- Hanya admin brand tersebut (dan super_admin) yang boleh upload, mengganti, atau menghapus.

## 7. Seed

- Brand **Ludovex Digital** diisi lengkap dari `data/services.ts`, `data/payments.ts`, dan `lib/config.ts`.
- 8 layanan, 16 produk nominal, 6 metode bayar (QRIS aktif; DANA, OVO, GoPay, ShopeePay, Virtual Account `aktif = false`), 2 voucher (`LUDOBARU`, `HEMAT5`). `biaya_admin` dan `biaya_supplier` layanan diisi 0 karena belum ada data.
- `harga_modal` belum tersedia, jadi sementara diisi sama dengan `harga_jual`. Ini wajib diganti dengan modal asli.
- 21 brand lain hanya berisi baris `brands` (nama + domain). Katalognya diisi saat repo masing-masing dikerjakan.
- `kode_ref` 21 brand lain bersifat provisional (3 huruf) agar unik; boleh diganti sebelum produksi.
- Domain Ludovex memakai `ludovexdigital.com` sesuai contoh di spesifikasi. Konfirmasi bila domain final berbeda.
- `jam_cek_tagihan` Ludovex diisi `08.00 - 21.00`.

## 8. Instalasi dan langkah manual

1. Apply migration berurutan (Supabase CLI `supabase db push`, atau SQL Editor):
   `brands` -> `katalog` -> `vouchers` -> `orders` -> `functions` -> `rls` -> `storage` -> `seed`.
2. Salin `.env.example` menjadi `.env.local`, isi URL project, anon key, dan `BRAND_SLUG`.
3. Buat user admin di Supabase Auth, lalu tautkan ke tabel `admins`:

```sql
insert into public.admins (user_id, brand_id, nama, role)
select 'UUID-AUTH-USER', b.id, 'Nama Owner', 'owner'
from public.brands b
where b.slug = 'ludovex-digital';
```

Super admin:

```sql
insert into public.admins (user_id, brand_id, nama, role)
values ('UUID-AUTH-USER', null, 'Developer', 'super_admin');
```

4. Matikan public signup di Supabase Auth.
5. Aktifkan `pg_cron` (opsional tetapi disarankan) agar pembatalan otomatis berjalan tiap menit.
6. Ganti `products.harga_modal` dengan modal asli.
7. Upload logo dan QRIS ke bucket, lalu isi `brands.logo_url` dan `brands.qris_image_url`.
8. Isi `services.biaya_admin` dan `services.biaya_supplier` untuk layanan tagihan bila nilainya sudah ada.

## 9. Aturan kerja tahap berikutnya

- Tahap 1 hanya dokumen dan database. Tidak mengubah halaman web dan tidak membuat UI.
- Setiap tahap wajib membaca dokumen ini terlebih dahulu.
- Jangan mengubah logic atau tampilan web yang sudah berjalan tanpa instruksi eksplisit.
- Jangan melemahkan RLS. Semua query admin harus terikat `brand_id`.
- Jangan menambah tabel/kolom/migration di repo brand. Perubahan skema hanya di repo master.
- Dashboard harus memakai RPC untuk perubahan status, bukan update langsung ke `orders`.
- Hitungan omzet, modal, dan total selalu dilakukan di database.

## 10. Formula dashboard

- `omzet`: total order `sukses` pada bulan berjalan (berdasarkan `completed_at`).
- `total_modal`: jumlah `harga_modal` order `sukses`.
- `total_potongan_voucher`: jumlah `potongan` order `sukses`.
- `net_profit`: `omzet - total_modal` (potongan sudah mengurangi omzet, tidak dikurangi dua kali).
- `rata_rata`: `omzet / jumlah_transaksi`.
- `persentase_batal`: order `dibatalkan` yang dibuat pada bulan itu dibagi total order yang dibuat pada bulan itu.
- `layanan_terlaris`: 3 layanan dengan jumlah order `sukses` terbanyak.
- `menunggu_cek` dan `sudah_bayar`: jumlah order aktif saat ini.
- Batas bulan memakai zona waktu `Asia/Jakarta`.
