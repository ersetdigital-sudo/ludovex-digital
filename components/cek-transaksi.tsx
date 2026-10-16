"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "./icon";
import { SERVICES, type ProductItem } from "@/data/services";
import { fmtDate, rp } from "@/lib/format";
import { readTx, type Tx } from "@/lib/tx";

const svcOf = (name: string) => SERVICES.find((s) => s.name === name) ?? SERVICES[0];

/** contoh transaksi supaya pencarian demo tetap bisa dicoba tanpa data asli */
function demoTx(key: string): Tx {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) % 1e9;
  const s = SERVICES[h % SERVICES.length];
  const item: ProductItem = s.items
    ? s.items[h % s.items.length]
    : [`Tagihan ${s.name}`, ((h % 40) + 8) * 5000];
  const isRef = key.startsWith("REF");

  return {
    ref: isRef
      ? key.includes("-")
        ? key
        : key.replace("REF", "REF-")
      : "REF-LDX" + String(h).padStart(8, "0").slice(-8),
    svc: s.name,
    svcId: s.id,
    prod: item[0],
    no: isRef ? "0812****" + String(h).slice(-4) : key,
    method: ["QRIS", "DANA", "OVO", "GoPay"][h % 4],
    admin: 0,
    total: item[1],
    disc: 0,
    voucher: null,
    time: new Date(Date.now() - (h % 720) * 60000).toISOString(),
    status: "Sukses",
    sn: /PLN/.test(s.name)
      ? String(h)
          .padStart(20, "7")
          .slice(0, 20)
          .replace(/(\d{4})(?=\d)/g, "$1-")
      : "SN" + String(h).padStart(10, "0"),
  };
}

function TxCard({ tx, onPick }: { tx: Tx; onPick: (ref: string) => void }) {
  const s = svcOf(tx.svc);
  return (
    <button
      type="button"
      onClick={() => onPick(tx.ref)}
      className="card w-full p-4 flex items-center gap-4 text-left hover:border-[#c3c9f3] transition"
    >
      <span className={`t-${s.tone} rounded-xl p-2.5 w-11 h-11 shrink-0`}>
        <Icon name={s.id as IconName} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{tx.prod}</div>
        <div className="text-xs text-[#6b7394] truncate">
          {tx.no} · {fmtDate(tx.time)}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-extrabold text-sm">{rp(tx.total)}</div>
        <span className={`badge ${tx.status === "Sukses" ? "b-ok" : "b-wait"} mt-1`}>
          {tx.status === "Sukses" ? "Sukses" : "Sedang dicek"}
        </span>
      </div>
    </button>
  );
}

const STEPS = [
  "Pesanan dibuat",
  "Pembayaran dikonfirmasi pelanggan",
  "Verifikasi pembayaran",
  "Transaksi sukses",
];

function TxDetail({ tx }: { tx: Tx }) {
  const done = tx.status === "Sukses" ? 4 : 2;
  const rows: [string, string][] = [
    ["Layanan", tx.svc],
    ["Produk", tx.prod],
    ["Nomor tujuan", tx.no],
    ["Metode", tx.method],
    [/PLN/.test(tx.svc) ? "Token" : "Serial number", tx.sn],
    ["Total", rp(tx.total)],
  ];

  return (
    <div className="card overflow-hidden">
      <div className="p-6 flex flex-wrap justify-between gap-3 items-start border-b border-[#eceefa]">
        <div>
          <div className="text-xs text-[#6b7394]">Kode referensi</div>
          <div className="font-mono font-extrabold text-lg">{tx.ref}</div>
        </div>
        <span className={`badge ${tx.status === "Sukses" ? "b-ok" : "b-wait"}`}>
          ● {tx.status === "Sukses" ? "Sukses" : "Sedang dicek"}
        </span>
      </div>

      <div className="p-6 grid md:grid-cols-2 gap-8">
        <div className="space-y-3 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <span className="text-[#6b7394]">{k}</span>
              <b className="text-right break-all">{v}</b>
            </div>
          ))}
        </div>

        <ol className="relative border-l-2 border-[#dfe2f5] ml-2 space-y-5">
          {STEPS.map((s, i) => (
            <li key={s} className="pl-5 relative">
              <span
                className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full ${
                  i < done
                    ? "bg-[#3b4fd8] ring-4 ring-[#e8ebff]"
                    : i === done
                      ? "bg-[#f5a623] ring-4 ring-[#fff3dc] animate-pulse"
                      : "bg-[#dfe2f5]"
                }`}
              />
              <div className={`font-semibold text-sm ${i > done ? "text-[#9aa1c2]" : ""}`}>{s}</div>
              <div className="text-xs text-[#6b7394]">
                {i < done
                  ? fmtDate(new Date(tx.time).getTime() + i * 15000)
                  : i === done
                    ? "Sedang berlangsung…"
                    : "Menunggu"}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function CekTransaksi({ initialQ = "" }: { initialQ?: string }) {
  const [q, setQ] = useState(initialQ);
  const [hits, setHits] = useState<Tx[]>([]);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState<Tx[]>([]);

  useEffect(() => {
    setHistory(readTx());
    if (initialQ) run(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = (raw: string) => {
    const value = (raw ?? "").trim();
    setQ(value);
    if (!value) {
      setHits([]);
      setSearched(false);
      return;
    }
    const k = value.replace(/\s/g, "").toUpperCase();
    let found = readTx().filter(
      (t) => t.ref.toUpperCase() === k || t.no.replace(/\s/g, "") === k,
    );
    if (
      !found.length &&
      (/^REF-?LDX\d{6,}$/.test(k) || /^(\+?62|0)8\d{7,12}$/.test(k) || /^\d{8,16}$/.test(k))
    ) {
      found = [demoTx(k)];
    }
    setHits(found);
    setSearched(true);
  };

  const pick = (ref: string) => {
    run(ref);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <section className="hero-bg">
        <div className="max-w-3xl mx-auto px-5 pt-12 pb-10 text-center">
          <span
            className="inline-block w-14 h-14 rounded-2xl text-white p-3.5"
            style={{ background: "linear-gradient(135deg,#3b4fd8,#7a5cf2)" }}
          >
            <Icon name="search" />
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold mt-4 tracking-tight">
            Cek Transaksi
          </h1>
          <p className="text-[#6b7394] mt-3">
            Masukkan kode referensi atau nomor tujuan untuk melihat status &amp; struk.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(q);
            }}
            className="mt-7 card p-2 flex flex-col sm:flex-row gap-2 shadow-[0_20px_50px_-25px_rgba(30,40,110,.4)]"
          >
            <input
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 px-4 py-3 outline-none min-w-0"
              placeholder="REF-LDX12345678 atau 0812…"
              aria-label="Kode referensi atau nomor tujuan"
            />
            <button className="btn">Cek Status</button>
          </form>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-5 py-10 min-h-[40vh]">
        <div>
          {searched && hits.length === 0 && (
            <div className="card p-8 text-center">
              <div className="text-4xl">🔍</div>
              <div className="font-bold mt-2">Transaksi tidak ditemukan</div>
              <p className="text-sm text-[#6b7394] mt-1">
                Periksa lagi kode referensi atau nomor tujuan. Butuh bantuan? Hubungi CS 24 jam.
              </p>
            </div>
          )}

          {searched && hits.length === 1 && <TxDetail tx={hits[0]} />}

          {searched && hits.length > 1 && (
            <div>
              <div className="font-bold mb-3">{hits.length} transaksi ditemukan</div>
              <div className="space-y-3">
                {hits.map((t) => (
                  <TxCard key={t.ref} tx={t} onPick={pick} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-10">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-xl">Riwayat di perangkat ini</h2>
            <Link href="/bayar" className="text-sm font-bold text-[#3b4fd8]">
              + Transaksi baru
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {history.length ? (
              history.map((t) => <TxCard key={t.ref} tx={t} onPick={pick} />)
            ) : (
              <div className="card p-8 text-center text-[#6b7394]">
                Belum ada transaksi di perangkat ini.
                <br />
                <Link href="/bayar" className="btn mt-4">
                  Mulai Transaksi
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
