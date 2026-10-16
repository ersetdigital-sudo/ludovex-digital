"use client";

import { useMemo, useState } from "react";
import { Icon, type IconName } from "./icon";
import { FAQ } from "@/data/faq";
import { CS_PHONE_DISPLAY, CS_WA } from "@/lib/config";

const TOPICS: [string, string][] = [["all", "Semua"], ...FAQ.map((f) => [f[0], f[1]] as [string, string])];

const QUICK: { icon: IconName; tone: string; title: string; sub: string; href?: string; topic?: string }[] = [
  { icon: "search", tone: "blue", title: "Cek Transaksi", sub: "Lacak status pesanan", href: "/cek" },
  {
    icon: "chat",
    tone: "green",
    title: "Chat CS",
    sub: "Via WhatsApp",
    href: `https://wa.me/${CS_WA}?text=${encodeURIComponent("Halo CS Ludovex Digital, saya butuh bantuan.")}`,
  },
  { icon: "wallet", tone: "peach", title: "Refund", sub: "Transaksi gagal", topic: "refund" },
  { icon: "shield", tone: "purple", title: "Keamanan", sub: "Tips bertransaksi aman", topic: "akun" },
];

export function HelpCenter() {
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("all");

  const query = q.trim().toLowerCase();

  const items = useMemo(() => {
    const groups = query || topic === "all" ? FAQ : FAQ.filter((f) => f[0] === topic);
    const list: { group: string; question: string; answer: string }[] = [];
    groups.forEach(([, title, entries]) =>
      entries.forEach(([question, answer]) =>
        list.push({ group: title, question, answer }),
      ),
    );
    return query
      ? list.filter((i) => `${i.question} ${i.answer}`.toLowerCase().includes(query))
      : list;
  }, [query, topic]);

  const title = query
    ? `Hasil untuk "${q.trim()}"`
    : topic === "all"
      ? "Semua pertanyaan"
      : (FAQ.find((f) => f[0] === topic)?.[1] ?? "Semua pertanyaan");

  const jump = (t: string) => {
    setTopic(t);
    setQ("");
    document.getElementById("judul-topik")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg,#2f3fc4,#6d5cf0)" }}>
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/10" />
        <div className="absolute -left-16 bottom-[-90px] w-64 h-64 rounded-full bg-white/10" />
        <div className="relative max-w-3xl mx-auto px-5 pt-14 pb-24 text-center">
          <span className="badge bg-white/15 text-white">Pusat Bantuan</span>
          <h1 className="text-3xl md:text-5xl font-extrabold mt-4 tracking-tight">
            Ada yang bisa kami bantu?
          </h1>
          <p className="text-white/80 mt-3">
            Cari jawaban cepat atau langsung ngobrol dengan tim CS kami.
          </p>
          <div className="mt-8 bg-white rounded-2xl p-2 flex items-center gap-2 shadow-[0_25px_60px_-25px_rgba(0,0,0,.5)]">
            <span className="w-6 h-6 ml-3 text-[#9aa1c2] shrink-0">
              <Icon name="search" />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 py-3 outline-none text-[#16204a] min-w-0"
              placeholder="Cari: refund, voucher, QRIS, token…"
              aria-label="Cari pertanyaan"
            />
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-5 -mt-14 relative">
        {/* akses cepat */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUICK.map((c) =>
            c.href ? (
              <a
                key={c.title}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener"
                className="card p-5 hover:-translate-y-1 transition shadow-[0_20px_40px_-25px_rgba(30,40,110,.4)]"
              >
                <span className={`block w-11 h-11 rounded-xl t-${c.tone} p-2.5`}>
                  <Icon name={c.icon} />
                </span>
                <div className="font-bold mt-3">{c.title}</div>
                <div className="text-xs text-[#6b7394] mt-1">{c.sub}</div>
              </a>
            ) : (
              <button
                key={c.title}
                type="button"
                onClick={() => jump(c.topic!)}
                className="card p-5 text-left hover:-translate-y-1 transition shadow-[0_20px_40px_-25px_rgba(30,40,110,.4)]"
              >
                <span className={`block w-11 h-11 rounded-xl t-${c.tone} p-2.5`}>
                  <Icon name={c.icon} />
                </span>
                <div className="font-bold mt-3">{c.title}</div>
                <div className="text-xs text-[#6b7394] mt-1">{c.sub}</div>
              </button>
            ),
          )}
        </div>

        {/* daftar tanya jawab */}
        <section className="mt-14 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 items-start">
          <aside className="min-w-0 md:sticky md:top-24">
            <div className="text-xs font-bold uppercase tracking-widest text-[#9aa1c2] mb-3 hidden md:block">
              Topik
            </div>
            <div className="flex md:flex-col gap-2 overflow-x-auto pb-2">
              {TOPICS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTopic(id);
                    setQ("");
                  }}
                  className={`topic opt py-2.5 px-4 text-sm font-semibold whitespace-nowrap ${
                    id === topic && !query ? "active" : ""
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0">
            <h2 id="judul-topik" className="text-2xl font-extrabold scroll-mt-28">
              {title}
            </h2>

            <div className="mt-5 space-y-3">
              {items.map((i) => (
                <details key={i.question} className="acc card px-5 py-4 group">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer">
                    <span>
                      <span className="block text-xs font-bold text-[#3b4fd8] mb-1">{i.group}</span>
                      <span className="font-bold">{i.question}</span>
                    </span>
                    <span className="chev w-8 h-8 shrink-0 rounded-full bg-[#f0f2ff] text-[#3b4fd8] grid place-items-center text-xl font-light">
                      +
                    </span>
                  </summary>
                  <p className="text-[#4b5375] leading-relaxed mt-3 pr-10">{i.answer}</p>
                </details>
              ))}
            </div>

            {items.length === 0 && (
              <div className="card p-8 text-center mt-5">
                <div className="font-bold">Belum ketemu jawabannya?</div>
                <p className="text-sm text-[#6b7394] mt-1">
                  Tanyakan langsung ke tim kami, kami bantu sampai beres.
                </p>
                <a
                  href={`https://wa.me/${CS_WA}`}
                  target="_blank"
                  rel="noopener"
                  className="btn mt-4"
                  style={{ background: "#25d366" }}
                >
                  Chat WhatsApp
                </a>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section
          className="my-16 rounded-[28px] p-8 md:p-12 grid md:grid-cols-[1fr_auto] gap-6 items-center"
          style={{ background: "linear-gradient(135deg,#eef0ff,#e6f3ff)" }}
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold">Masih butuh bantuan?</h2>
            <p className="text-[#6b7394] mt-2">
              Siapkan kode referensi transaksi agar tim kami bisa membantu lebih cepat.
            </p>
            <p className="mt-3 font-bold">WhatsApp: {CS_PHONE_DISPLAY}</p>
          </div>
          <a
            href={`https://wa.me/${CS_WA}?text=${encodeURIComponent("Halo CS Ludovex Digital, saya butuh bantuan.")}`}
            target="_blank"
            rel="noopener"
            className="btn px-7 py-4"
            style={{ background: "#25d366" }}
          >
            Hubungi CS via WhatsApp
          </a>
        </section>
      </main>
    </>
  );
}
