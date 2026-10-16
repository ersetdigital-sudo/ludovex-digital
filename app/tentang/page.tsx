import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { CS_WA, CS_PHONE_DISPLAY } from "@/lib/config";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description:
    "Ludovex Digital adalah layanan PPOB untuk pulsa, paket data, token listrik, top up e-wallet, dan tagihan bulanan.",
};

const VALUES: { icon: IconName; tone: string; title: string; desc: string }[] = [
  { icon: "clock", tone: "blue", title: "Cepat", desc: "Proses transaksi praktis dari HP kapan saja." },
  { icon: "shield", tone: "green", title: "Aman", desc: "Pembayaran via QRIS resmi dan setiap transaksi diverifikasi." },
  { icon: "chat", tone: "purple", title: "Dibantu CS", desc: "Tim kami siap membantu lewat WhatsApp." },
];

export default function TentangPage() {
  return (
    <>
      <section className="hero-bg">
        <div className="max-w-3xl mx-auto px-5 pt-14 pb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Tentang Kami</h1>
          <p className="text-[#6b7394] mt-3 text-lg">
            Satu tempat untuk semua pembayaran digital Anda.
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-5 py-12">
        <div className="card p-7 md:p-10 prose">
          <p className="!text-lg !text-[#16204a] font-medium">
            Ludovex Digital adalah layanan PPOB (Payment Point Online Bank) yang membantu Anda
            membeli pulsa, paket data, token listrik, top up e-wallet, dan membayar berbagai
            tagihan bulanan dengan cepat dan mudah.
          </p>
          <p className="mt-4">
            Kami percaya transaksi sehari-hari seharusnya sederhana: pilih layanan, masukkan
            nomor, bayar, selesai. Tanpa antre, tanpa ribet, dengan harga yang bersahabat.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          {VALUES.map((v) => (
            <div key={v.title} className="card p-6">
              <span className={`block w-11 h-11 rounded-xl t-${v.tone} p-2.5`}>
                <Icon name={v.icon} />
              </span>
              <h3 className="font-bold mt-3">{v.title}</h3>
              <p className="text-sm text-[#6b7394] mt-1">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="card p-7 md:p-10 mt-6 prose">
          <h2 className="!mt-0">Layanan kami</h2>
          <ul>
            <li>Pulsa &amp; paket data semua operator</li>
            <li>Token listrik PLN</li>
            <li>Top up e-wallet</li>
            <li>Tagihan PDAM, BPJS, Internet &amp; TV, dan Multifinance</li>
          </ul>
          <h2>Hubungi kami</h2>
          <p>
            WhatsApp CS:{" "}
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

        <div className="mt-8 text-center">
          <Link href="/bayar" className="btn">
            Mulai Transaksi
          </Link>
        </div>
      </main>
    </>
  );
}
