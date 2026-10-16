import type { Metadata } from "next";
import { CS_PHONE_DISPLAY, CS_WA } from "@/lib/config";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Bagaimana Ludovex Digital mengumpulkan, menggunakan, dan melindungi data Anda.",
};

export default function KebijakanPrivasiPage() {
  return (
    <>
      <section className="hero-bg">
        <div className="max-w-3xl mx-auto px-5 pt-14 pb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Kebijakan Privasi</h1>
          <p className="text-[#6b7394] mt-3 text-lg">
            Bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda.
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-5 py-12">
        <div className="card p-7 md:p-10 prose">
          <p className="text-sm">Terakhir diperbarui: 16 Oktober 2026</p>

          <h2>1. Data yang kami kumpulkan</h2>
          <ul>
            <li>Nomor tujuan transaksi (nomor HP, ID pelanggan, nomor meter, atau nomor kontrak).</li>
            <li>Detail transaksi: produk, nominal, metode pembayaran, dan waktu transaksi.</li>
            <li>Informasi yang Anda kirim saat menghubungi CS, misalnya bukti pembayaran.</li>
          </ul>

          <h2>2. Penggunaan data</h2>
          <ul>
            <li>Memproses dan memverifikasi transaksi Anda.</li>
            <li>Menampilkan status dan riwayat transaksi.</li>
            <li>Memberikan bantuan layanan pelanggan.</li>
            <li>Mencegah penipuan dan penyalahgunaan layanan.</li>
          </ul>

          <h2>3. Penyimpanan di perangkat</h2>
          <p>
            Riwayat transaksi dan kode voucher dapat disimpan di browser perangkat Anda (local
            storage) agar Anda bisa mengecek status dengan mudah. Data ini dapat Anda hapus kapan
            saja dengan membersihkan data browser.
          </p>

          <h2>4. Berbagi data</h2>
          <p>
            Kami tidak menjual data pribadi Anda. Data hanya dibagikan kepada mitra yang
            diperlukan untuk menyelesaikan transaksi (misalnya penyedia layanan atau penyelenggara
            pembayaran), atau jika diwajibkan oleh hukum.
          </p>

          <h2>5. Keamanan</h2>
          <p>
            Kami berupaya menjaga keamanan data Anda dengan langkah yang wajar. Jangan pernah
            membagikan PIN, kata sandi, atau kode OTP kepada siapa pun, termasuk yang mengaku
            sebagai CS kami.
          </p>

          <h2>6. Hak Anda</h2>
          <p>
            Anda dapat meminta akses, koreksi, atau penghapusan data transaksi Anda dengan
            menghubungi CS kami.
          </p>

          <h2>7. Perubahan kebijakan</h2>
          <p>Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan akan ditampilkan di halaman ini.</p>

          <h2>8. Kontak</h2>
          <p>
            Pertanyaan seputar privasi: WhatsApp{" "}
            <a
              href={`https://wa.me/${CS_WA}`}
              target="_blank"
              rel="noopener"
              className="font-bold text-[#3b4fd8]"
            >
              {CS_PHONE_DISPLAY}
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
