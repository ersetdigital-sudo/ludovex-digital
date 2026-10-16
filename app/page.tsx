import Link from "next/link";
import { CopyVoucher, QuickCekForm, QuickPayForm } from "@/components/home-forms";
import { Icon } from "@/components/icon";
import { Reveal } from "@/components/reveal";
import { ServiceGrid } from "@/components/service-grid";
import { HOME_FAQ } from "@/data/faq";
import { POPULAR } from "@/data/services";
import { BRAND_STRIP } from "@/lib/config";

const STEPS = [
  { n: 1, title: "Pilih layanan", desc: "Pulsa, data, PLN, e-wallet, atau tagihan bulanan." },
  {
    n: 2,
    title: "Isi nomor & nominal",
    desc: "Nomor HP, ID pelanggan, atau cek tagihan otomatis.",
  },
  { n: 3, title: "Bayar", desc: "Scan QRIS, e-wallet, atau virtual account bank." },
  { n: 4, title: "Struk terbit", desc: "Simpan kode referensi, pantau di Cek Transaksi." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOME_FAQ.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="hero-bg relative overflow-hidden">
        <div className="dotgrid absolute right-0 top-10 w-72 h-72 opacity-60 hidden md:block" />
        <div className="max-w-6xl mx-auto px-5 pt-12 pb-16 md:py-16 grid md:grid-cols-[1.05fr_1fr] gap-12 items-center relative">
          <div>
            <h1 className="text-[2.6rem] leading-[1.05] md:text-[3.9rem] font-extrabold tracking-tight">
              Semua pembayaran digital.{" "}
              <span className="bg-gradient-to-r from-[#3b4fd8] to-[#7a5cf2] bg-clip-text text-transparent">
                Satu tempat.
              </span>
            </h1>
            <p className="mt-5 text-lg text-[#6b7394] max-w-md">
              Isi pulsa, beli token listrik, bayar tagihan, dan top up e-wallet dalam hitungan
              detik. Tanpa daftar, struk langsung terbit.
            </p>

            <QuickPayForm />

            <div className="mt-7 flex items-center gap-4">
              <div className="flex -space-x-2">
                <span className="w-9 h-9 rounded-full border-2 border-white bg-[#c7d2fe]" />
                <span className="w-9 h-9 rounded-full border-2 border-white bg-[#ddd6fe]" />
                <span className="w-9 h-9 rounded-full border-2 border-white bg-[#a7f3d0]" />
                <span className="w-9 h-9 rounded-full border-2 border-white bg-[#3b4fd8] text-white text-[10px] font-bold grid place-items-center">
                  +1jt
                </span>
              </div>
              <div className="text-sm">
                <div className="font-bold flex items-center gap-1">
                  <span className="w-4 h-4 text-[#f5b301]">
                    <Icon name="star" />
                  </span>
                  4.9 dari pengguna
                </div>
                <div className="text-[#6b7394]">Transaksi diproses rata-rata &lt; 1 menit</div>
              </div>
            </div>
          </div>

          {/* Kartu promo + akses cepat */}
          <Reveal delay={0.1} className="relative">
            <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-[#c9c2ff] to-[#bfe0ff] blur-3xl opacity-60" />
            <div
              className="relative rounded-[28px] p-7 md:p-8 text-white overflow-hidden shadow-[0_40px_80px_-35px_rgba(30,40,110,.7)]"
              style={{ background: "linear-gradient(135deg,#3b4fd8 0%,#6d5cf0 60%,#8f6cf7 100%)" }}
            >
              <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10" />
              <div className="absolute right-10 bottom-[-60px] w-40 h-40 rounded-full bg-white/10" />
              <div className="relative flex justify-between items-start">
                <span className="text-xs font-bold tracking-widest uppercase text-white/75">
                  Promo Oktober
                </span>
                <span className="px-3 py-1 rounded-full bg-[#7ff0c6] text-[#0d4d39] text-xs font-extrabold">
                  Pengguna baru
                </span>
              </div>
              <div className="relative mt-4 text-[13px] font-semibold text-white/80">
                Cashback hingga
              </div>
              <div className="relative text-6xl md:text-7xl font-extrabold leading-none tracking-tight">
                20<span className="text-4xl align-top">%</span>
              </div>
              <div className="relative mt-2 text-lg font-bold">untuk transaksi pertamamu</div>
              <p className="relative text-sm text-white/75 mt-1">
                Berlaku pulsa, paket data &amp; token PLN. Maks. Rp20.000.
              </p>
              <div className="relative mt-6 flex items-center gap-3 flex-wrap">
                <div className="flex items-center rounded-xl border-2 border-dashed border-white/50 bg-white/10 pl-4 pr-1.5 py-1.5 gap-3">
                  <span className="font-mono font-extrabold tracking-wider">LUDOBARU</span>
                  <CopyVoucher />
                </div>
                <Link
                  href="/bayar?voucher=LUDOBARU"
                  className="font-bold text-sm underline underline-offset-4"
                >
                  Pakai sekarang →
                </Link>
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-4 mt-4">
              <Link href="/pln" className="card p-5 hover:-translate-y-1 transition">
                <div className="flex items-center gap-2">
                  <span className="t-green rounded-xl p-2 w-10 h-10">
                    <Icon name="pln" />
                  </span>
                  <span className="badge b-ok">Hemat</span>
                </div>
                <div className="mt-3 font-extrabold text-lg leading-tight">
                  Token PLN
                  <br />
                  bebas admin
                </div>
                <div className="text-xs text-[#6b7394] mt-1">Bayar pakai QRIS</div>
              </Link>
              <Link href="/data" className="card p-5 hover:-translate-y-1 transition">
                <div className="flex items-center gap-2">
                  <span className="t-purple rounded-xl p-2 w-10 h-10">
                    <Icon name="data" />
                  </span>
                  <span className="badge b-wait">Flash sale</span>
                </div>
                <div className="mt-3 font-extrabold text-lg leading-tight">
                  Data 12 GB
                  <br />
                  <span className="text-[#3b4fd8]">Rp60.000</span>
                </div>
                <div className="text-xs text-[#6b7394] mt-1">
                  <s>Rp72.000</s> · aktif 30 hari
                </div>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* STRIP METODE BAYAR */}
      <div className="bg-white border-y border-[#eceefa]">
        <div className="max-w-6xl mx-auto px-5 py-5 flex flex-wrap justify-center md:justify-between gap-x-10 gap-y-3 text-sm font-bold text-[#8a91b4]">
          {BRAND_STRIP.map((b) => (
            <span key={b}>{b}</span>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-5">
        {/* LAYANAN */}
        <section id="layanan" className="py-16 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold">Layanan</h2>
              <p className="text-[#6b7394] mt-1">Pilih layanan, masukkan nomor, bayar. Selesai.</p>
            </div>
            <Link href="/bayar" className="text-sm font-bold text-[#3b4fd8]">
              Lihat semua →
            </Link>
          </div>
          <ServiceGrid />
        </section>

        {/* POPULER */}
        <section id="populer" className="pb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold">Populer</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {POPULAR.map((p) => (
              <Reveal key={p.title} className="card p-5 flex items-center gap-4">
                <span className={`t-${p.tone} rounded-xl p-3 w-12 h-12 shrink-0`}>
                  <Icon name={p.icon} />
                </span>
                <div className="flex-1">
                  <div className="font-bold">{p.title}</div>
                  <div className="text-sm text-[#6b7394]">{p.sub}</div>
                  <div className="font-extrabold text-[#3b4fd8] mt-1">{p.price}</div>
                </div>
                <Link href={`/${p.route}`} className="btn btn-ghost py-2 px-4 text-sm">
                  Beli
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ALUR */}
        <section id="alur" className="py-16 scroll-mt-24">
          <div className="text-center">
            <h2 className="text-2xl md:text-4xl font-extrabold">
              Alur transaksi, cuma 4 langkah
            </h2>
            <p className="text-[#6b7394] mt-2">
              Dari pilih layanan sampai struk terbit, semua dalam satu halaman.
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            <div className="hidden lg:block absolute top-9 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-[#c9cff7] via-[#8a6cf7] to-[#c9cff7]" />
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08} className="card p-6 relative">
                {s.n === 4 ? (
                  <div className="w-12 h-12 rounded-2xl bg-[#16835e] text-white grid place-items-center p-3">
                    <Icon name="check" />
                  </div>
                ) : (
                  <div
                    className="w-12 h-12 rounded-2xl text-white grid place-items-center font-extrabold"
                    style={{ background: "linear-gradient(135deg,#3b4fd8,#7a5cf2)" }}
                  >
                    {s.n}
                  </div>
                )}
                <h3 className="font-bold text-lg mt-4">{s.title}</h3>
                <p className="text-[#6b7394] mt-1 text-sm">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA CEK */}
        <section className="pb-16">
          <div className="card p-6 md:p-10 grid md:grid-cols-[1fr_1.1fr] gap-8 items-center overflow-hidden relative">
            <div>
              <span className="badge b-wait">Lacak pesanan</span>
              <h2 className="text-2xl md:text-3xl font-extrabold mt-3">
                Cek status transaksimu kapan saja
              </h2>
              <p className="text-[#6b7394] mt-2">
                Masukkan kode referensi (REF-LDX…) atau nomor tujuan untuk melihat status dan
                struk.
              </p>
            </div>
            <QuickCekForm />
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="pb-16 max-w-3xl mx-auto scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center">Pertanyaan umum</h2>
          <div className="mt-6 card divide-y divide-[#e7e9f5]">
            {HOME_FAQ.map(([q, a]) => (
              <details key={q} className="p-5">
                <summary className="font-semibold cursor-pointer">{q}</summary>
                <p className="text-[#6b7394] mt-2">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* CTA AKHIR */}
      <section className="px-5 pb-16">
        <div
          className="max-w-6xl mx-auto rounded-[28px] p-10 md:p-14 text-white text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#3b4fd8,#6d5cf0)" }}
        >
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -left-8 -bottom-12 w-40 h-40 rounded-full bg-white/10" />
          <h2 className="text-3xl md:text-4xl font-extrabold relative">Bayar apa pun, kapan pun.</h2>
          <p className="mt-3 text-white/80 relative">
            Mulai transaksi pertamamu sekarang, tanpa ribet.
          </p>
          <Link href="/bayar" className="btn btn-white mt-7 relative inline-flex">
            Mulai Sekarang
          </Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </>
  );
}
