-- 08 — seed
-- Ludovex Digital lengkap dari data/services.ts, data/payments.ts, lib/config.ts.
-- 21 brand lain hanya nama + domain; katalog diisi saat repo masing-masing dikerjakan.

-- ============================================================
-- Brand
-- ============================================================

insert into public.brands (
  nama, slug, domain, tagline, logo_url, warna_utama, kode_ref,
  wa_cs, qris_image_url, batas_bayar_menit, maks_order_pending, jam_cek_tagihan
)
values (
  'Ludovex Digital',
  'ludovex-digital',
  'ludovexdigital.com',
  'Semua pembayaran digital, satu tempat',
  null,
  '#3b4fd8',
  'LDX',
  '6285711172317',
  'https://res.cloudinary.com/dqjh7utdb/image/upload/v1792161327/camhvfeu1lcm0ps8ieiz.jpg',
  15,
  3,
  '08.00 - 21.00'
)
on conflict (slug) do nothing;

insert into public.brands (nama, slug, domain, kode_ref)
values
  ('Ludexa Store',     'ludexa-store',     'ludexastore.com',      'LDS'),
  ('Juevix Online',    'juevix-online',    'juevixonline.my.id',   'JVX'),
  ('Fuerzax Global',   'fuerzax-global',   'fuerzaxglobal.my.id',  'FRX'),
  ('Ganarvez Idea',    'ganarvez-idea',    'ganarvezidea.my.id',   'GNV'),
  ('Rayoza Online',    'rayoza-online',    'rayozaonline.my.id',   'RYZ'),
  ('Ldico Games',      'ldico-games',      'ldicogames.my.id',     'LDC'),
  ('Nivelix Game',     'nivelix-game',     'nivelixgame.com',      'NVX'),
  ('Juegora Satelit',  'juegora-satelit',  'juegorasatelit.com',   'JGS'),
  ('Oraviola',         'oraviola',         'oraviola.com',         'OVL'),
  ('Fulgora Seluler',  'fulgora-seluler',  'fulgoraselular.com',   'FGS'),
  ('Poderix Digital',  'poderix-digital',  'poderixdigital.com',   'PDX'),
  ('Chainovaku',       'chainovaku',       'chainovaku.com',       'CNV'),
  ('Sanuxia Global',   'sanuxia-global',   'sanuxiaglobal.com',    'SNX'),
  ('Niranova',         'niranova',         'niranova.my.id',       'NRV'),
  ('Chaizen Hub',      'chaizen-hub',      'chaizenhub.my.id',     'CHZ'),
  ('Niranix Digital',  'niranix-digital',  'niranixdigital.com',   'NRX'),
  ('The Pix Cloud',    'the-pix-cloud',    'thepixcloud.my.id',    'TPC'),
  ('Maneela Hub',      'maneela-hub',      'maneela-hub.com',      'MNL'),
  ('Suknexa Idea',     'suknexa-idea',     'suknexaidea.com',      'SKX'),
  ('Ploynora Games',   'ploynora-games',   'ploynoragames.com',    'PLY'),
  ('Siemvax Hub',      'siemvax-hub',      'siemvaxhub.com',       'SMV')
on conflict (slug) do nothing;

-- ============================================================
-- Layanan Ludovex
-- ============================================================

with b as (
  select id from public.brands where slug = 'ludovex-digital'
)
insert into public.services (
  brand_id, nama, slug, jenis, input_fields, biaya_admin, biaya_supplier, urutan, aktif
)
select
  b.id,
  v.nama,
  v.slug,
  v.jenis,
  v.input_fields::jsonb,
  0,
  0,
  v.urutan,
  true
from b
cross join (values
  ('Pulsa', 'pulsa', 'nominal',
   '[{"key":"nomor_hp","label":"Nomor HP","placeholder":"08xx xxxx xxxx","wajib":true}]', 1),
  ('Paket Data', 'data', 'nominal',
   '[{"key":"nomor_hp","label":"Nomor HP","placeholder":"08xx xxxx xxxx","wajib":true}]', 2),
  ('Token PLN', 'pln', 'nominal',
   '[{"key":"id_meter","label":"ID Pelanggan / No. Meter","placeholder":"11 digit nomor meter","wajib":true}]', 3),
  ('PDAM', 'pdam', 'tagihan',
   '[{"key":"nomor_pelanggan","label":"Nomor Pelanggan","placeholder":"Nomor pelanggan PDAM","wajib":true}]', 4),
  ('BPJS', 'bpjs', 'tagihan',
   '[{"key":"nomor_va","label":"Nomor VA Keluarga","placeholder":"8888 xxxx xxxx xxxx","wajib":true}]', 5),
  ('Internet & TV', 'internet', 'tagihan',
   '[{"key":"id_pelanggan","label":"ID Pelanggan","placeholder":"ID pelanggan provider","wajib":true}]', 6),
  ('E-Wallet', 'ewallet', 'nominal',
   '[{"key":"nomor_hp","label":"Nomor HP terdaftar","placeholder":"08xx xxxx xxxx","wajib":true}]', 7),
  ('Multifinance', 'multifinance', 'tagihan',
   '[{"key":"nomor_kontrak","label":"Nomor Kontrak","placeholder":"Nomor kontrak cicilan","wajib":true}]', 8)
) as v(nama, slug, jenis, input_fields, urutan)
on conflict (brand_id, slug) do nothing;

-- ============================================================
-- Produk nominal Ludovex
-- harga_modal sementara = harga_jual; wajib diganti modal asli
-- ============================================================

with b as (
  select id from public.brands where slug = 'ludovex-digital'
)
insert into public.products (
  brand_id, service_id, nama, harga_modal, harga_jual, urutan, aktif
)
select
  b.id,
  s.id,
  v.nama,
  v.harga,
  v.harga,
  v.urutan,
  true
from b
join public.services s on s.brand_id = b.id
join (values
  ('pulsa', 'Pulsa 10.000', 11500, 1),
  ('pulsa', 'Pulsa 25.000', 26000, 2),
  ('pulsa', 'Pulsa 50.000', 50500, 3),
  ('pulsa', 'Pulsa 100.000', 99000, 4),
  ('data', '5 GB / 30 hari', 35000, 1),
  ('data', '12 GB / 30 hari', 60000, 2),
  ('data', '25 GB / 30 hari', 95000, 3),
  ('data', 'Unlimited Harian', 120000, 4),
  ('pln', 'Token 20.000', 21500, 1),
  ('pln', 'Token 50.000', 51500, 2),
  ('pln', 'Token 100.000', 101500, 3),
  ('pln', 'Token 200.000', 201500, 4),
  ('ewallet', 'Top up 50.000', 51000, 1),
  ('ewallet', 'Top up 100.000', 101000, 2),
  ('ewallet', 'Top up 200.000', 201000, 3),
  ('ewallet', 'Top up 500.000', 501000, 4)
) as v(service_slug, nama, harga, urutan)
  on v.service_slug = s.slug
on conflict (service_id, nama) do nothing;

-- ============================================================
-- Metode bayar Ludovex (yang hidden tetap disimpan, aktif = false)
-- ============================================================

with b as (
  select id from public.brands where slug = 'ludovex-digital'
)
insert into public.payment_methods (brand_id, nama, tipe, biaya_admin, urutan, aktif)
select b.id, v.nama, v.tipe, v.biaya_admin, v.urutan, v.aktif
from b
cross join (values
  ('QRIS', 'qr', 0, 1, true),
  ('DANA', 'ewallet', 1000, 2, false),
  ('OVO', 'ewallet', 1000, 3, false),
  ('GoPay', 'ewallet', 1000, 4, false),
  ('ShopeePay', 'ewallet', 1000, 5, false),
  ('Virtual Account', 'va', 2500, 6, false)
) as v(nama, tipe, biaya_admin, urutan, aktif)
on conflict (brand_id, nama) do nothing;

-- ============================================================
-- Voucher Ludovex
-- ============================================================

insert into public.vouchers (
  brand_id, kode, jenis, nilai, maks_potongan, min_transaksi, service_ids, aktif
)
select
  b.id,
  'LUDOBARU',
  'persen',
  20,
  20000,
  0,
  coalesce(
    array(
      select s.id
      from public.services s
      where s.brand_id = b.id
        and s.slug in ('pulsa', 'data', 'pln')
    ),
    '{}'::uuid[]
  ),
  true
from public.brands b
where b.slug = 'ludovex-digital'
on conflict (brand_id, kode) do nothing;

insert into public.vouchers (
  brand_id, kode, jenis, nilai, maks_potongan, min_transaksi, service_ids, aktif
)
select
  b.id,
  'HEMAT5',
  'tetap',
  5000,
  null,
  50000,
  '{}'::uuid[],
  true
from public.brands b
where b.slug = 'ludovex-digital'
on conflict (brand_id, kode) do nothing;
