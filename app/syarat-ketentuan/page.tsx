import type { Metadata } from "next";
import { getPublicBrand } from "@/lib/db/server";
import { waDisplay } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const brand = (await getPublicBrand()).data;
  return {
    title: "Syarat & Ketentuan",
    description: `Ketentuan penggunaan layanan ${brand?.nama ?? "kami"}.`,
  };
}

export default async function SyaratKetentuanPage() {
  const brand = (await getPublicBrand()).data;
  const brandName = brand?.nama ?? "PPOB";
  const wa = brand?.wa_cs ?? null;
  const waNumber = waDisplay(wa);

  return (
    <>
      <section className="hero-bg">
        <div className="max-w-3xl mx-auto px-5 pt-14 pb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Syarat &amp; Ketentuan
          </h1>
          <p className="text-[#6b7394] mt-3 text-lg">
            Ketentuan penggunaan layanan {brandName}.
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-5 py-12">
        <div className="card p-7 md:p-10 prose">
          <p className="text-sm">Terakhir diperbarui: 16 Oktober 2026</p>

          <h2>1. Ketentuan umum</h2>
          <p>
            Dengan menggunakan layanan {brandName}, Anda dianggap telah membaca dan
            menyetujui syarat &amp; ketentuan ini.
          </p>

          <h2>2. Kebenaran data</h2>
          <p>
            Anda bertanggung jawab memastikan nomor tujuan dan nominal yang dimasukkan sudah
            benar. Kesalahan input nomor oleh pengguna berada di luar tanggung jawab kami.
          </p>

          <h2>3. Pembayaran</h2>
          <ul>
            <li>Pembayaran via QRIS wajib sesuai dengan total yang tertera.</li>
            <li>Transaksi diproses setelah pembayaran berhasil diverifikasi.</li>
            <li>Simpan kode referensi sebagai bukti transaksi.</li>
          </ul>

          <h2>4. Transaksi gagal &amp; pengembalian dana</h2>
          <p>
            Jika transaksi gagal diproses setelah pembayaran terverifikasi, dana akan
            dikembalikan atau transaksi diproses ulang setelah konfirmasi dengan CS.
          </p>

          <h2>5. Promo &amp; voucher</h2>
          <p>
            Setiap promo memiliki syarat masing-masing dan dapat berubah atau berakhir
            sewaktu-waktu. Penyalahgunaan promo dapat menyebabkan transaksi dibatalkan.
          </p>

          <h2>6. Larangan</h2>
          <p>
            Dilarang menggunakan layanan untuk aktivitas penipuan, pencucian uang, atau kegiatan
            yang melanggar hukum.
          </p>

          <h2>7. Bantuan</h2>
          <p>
            Kendala transaksi dapat disampaikan melalui WhatsApp{" "}
            {wa ? (
              <a
                href={`https://wa.me/${wa.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener"
                className="font-bold text-[#3b4fd8]"
              >
                {waNumber}
              </a>
            ) : (
              "-"
            )}{" "}
            dengan menyertakan kode referensi.
          </p>
        </div>
      </main>
    </>
  );
}
