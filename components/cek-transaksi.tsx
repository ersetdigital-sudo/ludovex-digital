"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyButton } from "./copy-button";
import { Icon } from "./icon";
import type { Service } from "@/data/services";
import { checkOrder } from "@/lib/db/client";
import { toPublicError } from "@/lib/db/errors";
import { PUBLIC_STATUS } from "@/lib/db/status";
import type { OrderLookup } from "@/lib/db/types";
import { fmtDate, rp, waLink } from "@/lib/format";
import { readRefs } from "@/lib/tx";

function serviceOf(services: Service[], name: string) {
  return services.find((service) => service.name === name) ?? null;
}

function TxCard({
  order,
  services,
  onPick,
}: {
  order: OrderLookup;
  services: Service[];
  onPick: (ref: string) => void;
}) {
  const service = serviceOf(services, order.layanan);
  const status = PUBLIC_STATUS[order.status];

  return (
    <button
      type="button"
      onClick={() => onPick(order.ref)}
      className="card w-full p-4 flex items-center gap-4 text-left hover:border-[#c3c9f3] transition"
    >
      <span className={`t-${service?.tone ?? "blue"} rounded-xl p-2.5 w-11 h-11 shrink-0`}>
        <Icon name={service?.icon ?? "search"} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{order.produk ?? order.layanan}</div>
        <div className="text-xs text-[#6b7394] truncate">
          {order.nomor_tujuan} · {fmtDate(order.created_at)}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-extrabold text-sm">
          {order.total !== null ? rp(order.total) : "Belum ditetapkan"}
        </div>
        <span className={`${status.badgeClass} mt-1`}>{status.label}</span>
      </div>
    </button>
  );
}

type TimelineStep = {
  label: string;
  detail?: string;
  state: "done" | "current" | "pending";
};

function timeline(order: OrderLookup): TimelineStep[] {
  const created = fmtDate(order.created_at);
  const paid = order.paid_at ? fmtDate(order.paid_at) : null;
  const done = order.completed_at ? fmtDate(order.completed_at) : null;

  if (order.status === "menunggu_cek") {
    return [
      { label: "Pesanan dibuat", detail: created, state: "done" },
      {
        label: "Menunggu pengecekan admin",
        detail: "Admin akan mengecek tagihan.",
        state: "current",
      },
      { label: "Pembayaran", detail: "Menunggu", state: "pending" },
      { label: "Selesai", detail: "Menunggu", state: "pending" },
    ];
  }

  if (order.status === "menunggu_bayar") {
    return [
      { label: "Pesanan dibuat", detail: created, state: "done" },
      {
        label: "Menunggu pembayaran",
        detail: order.expires_at ? `Batas ${fmtDate(order.expires_at)}` : "Menunggu",
        state: "current",
      },
      { label: "Pembayaran dicek admin", detail: "Menunggu", state: "pending" },
      { label: "Selesai", detail: "Menunggu", state: "pending" },
    ];
  }

  if (order.status === "sudah_bayar") {
    return [
      { label: "Pesanan dibuat", detail: created, state: "done" },
      { label: "Pembayaran dikonfirmasi", detail: paid ?? "Sudah dibayar", state: "done" },
      {
        label: "Pembayaran dicek admin",
        detail: "Admin sedang memproses.",
        state: "current",
      },
      { label: "Selesai", detail: "Menunggu", state: "pending" },
    ];
  }

  if (order.status === "sukses") {
    return [
      { label: "Pesanan dibuat", detail: created, state: "done" },
      { label: "Pembayaran dikonfirmasi", detail: paid ?? "Sudah dibayar", state: "done" },
      { label: "Pembayaran dicek admin", detail: paid ?? "Selesai", state: "done" },
      { label: "Transaksi selesai", detail: done ?? "Selesai", state: "done" },
    ];
  }

  return [
    { label: "Pesanan dibuat", detail: created, state: "done" },
    {
      label: "Transaksi dibatalkan",
      detail: "Transaksi ini tidak diproses.",
      state: "current",
    },
    { label: "Pembayaran", detail: "Tidak dilanjutkan", state: "pending" },
    { label: "Selesai", detail: "Tidak dilanjutkan", state: "pending" },
  ];
}

function TxDetail({ order }: { order: OrderLookup }) {
  const status = PUBLIC_STATUS[order.status];
  const steps = timeline(order);
  const snLabel = /pln/i.test(order.layanan) ? "Token" : "SN / Token";

  return (
    <div className="card overflow-hidden">
      <div className="p-6 flex flex-wrap justify-between gap-3 items-start border-b border-[#eceefa]">
        <div>
          <div className="text-xs text-[#6b7394]">Kode referensi</div>
          <div className="font-mono font-extrabold text-lg">{order.ref}</div>
        </div>
        <span className={status.badgeClass}>● {status.label}</span>
      </div>

      <div className="p-6 grid md:grid-cols-2 gap-8">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-[#6b7394]">Layanan</span>
            <b className="text-right break-all">{order.layanan}</b>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[#6b7394]">Produk</span>
            <b className="text-right break-all">{order.produk ?? order.layanan}</b>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[#6b7394]">Nomor tujuan</span>
            <b className="text-right break-all">{order.nomor_tujuan}</b>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[#6b7394]">Total</span>
            <b className="text-right">
              {order.total !== null ? rp(order.total) : "Belum ditetapkan"}
            </b>
          </div>
          <div className="flex justify-between gap-3 items-start">
            <span className="text-[#6b7394]">{snLabel}</span>
            <span className="text-right break-all inline-flex items-center justify-end gap-2 flex-wrap">
              <b className="font-mono">{order.sn ?? "-"}</b>
              {order.sn ? (
                <CopyButton
                  value={order.sn}
                  className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-[#3b4fd8] border border-[#e7e9f5] hover:bg-[#eef0ff] active:scale-95 transition"
                />
              ) : null}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[#6b7394]">Dibuat</span>
            <b className="text-right">{fmtDate(order.created_at)}</b>
          </div>
          {order.paid_at ? (
            <div className="flex justify-between gap-3">
              <span className="text-[#6b7394]">Dibayar</span>
              <b className="text-right">{fmtDate(order.paid_at)}</b>
            </div>
          ) : null}
          {order.completed_at ? (
            <div className="flex justify-between gap-3">
              <span className="text-[#6b7394]">Selesai</span>
              <b className="text-right">{fmtDate(order.completed_at)}</b>
            </div>
          ) : null}
        </div>

        <ol className="relative border-l-2 border-[#dfe2f5] ml-2 space-y-5">
          {steps.map((step) => (
            <li key={step.label} className="pl-5 relative">
              <span
                className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full ${
                  step.state === "done"
                    ? "bg-[#3b4fd8] ring-4 ring-[#e8ebff]"
                    : step.state === "current"
                      ? "bg-[#f5a623] ring-4 ring-[#fff3dc] animate-pulse"
                      : "bg-[#dfe2f5]"
                }`}
              />
              <div
                className={`font-semibold text-sm ${
                  step.state === "pending" ? "text-[#9aa1c2]" : ""
                }`}
              >
                {step.label}
              </div>
              <div className="text-xs text-[#6b7394]">{step.detail ?? "Menunggu"}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function CekTransaksi({
  initialQ = "",
  brandName = "PPOB",
  waCs = null,
  brandSlug,
  services = [],
}: {
  initialQ?: string;
  brandName?: string;
  waCs?: string | null;
  brandSlug: string;
  services?: Service[];
}) {
  const [q, setQ] = useState(initialQ);
  const [hits, setHits] = useState<OrderLookup[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<OrderLookup[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const run = async (raw: string) => {
    const value = raw.trim();
    setQ(value);
    setError(null);
    if (!value) {
      setHits([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(false);
    try {
      const cleaned = value.replace(/[\s-]/g, "");
      const looksLikeRef = /[a-z]/i.test(value);
      let results = await checkOrder({
        brandSlug,
        ...(looksLikeRef ? { ref: value } : { nomorTujuan: cleaned }),
      });

      if (results.length === 0) {
        const second = await checkOrder({
          brandSlug,
          ...(looksLikeRef ? { nomorTujuan: cleaned } : { ref: value }),
        });
        const seen = new Set(results.map((item) => item.ref));
        results = [...results, ...second.filter((item) => !seen.has(item.ref))];
      }

      setHits(results);
      setSearched(true);
    } catch (err) {
      setHits([]);
      setError(toPublicError(err).message);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQ) void run(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ, brandSlug]);

  useEffect(() => {
    const refs = readRefs();
    if (refs.length === 0) {
      setHistory([]);
      setHistoryLoading(false);
      return;
    }

    let active = true;
    setHistoryLoading(true);
    setHistoryError(null);
    Promise.all(
      refs.map((ref) =>
        checkOrder({ brandSlug, ref })
          .then((items) => items.find((item) => item.ref === ref) ?? null)
          .catch(() => null),
      ),
    )
      .then((items) => {
        if (!active) return;
        const found = items.filter((item): item is OrderLookup => item !== null);
        setHistory(found);
        if (found.length === 0) {
          setHistoryError("Riwayat di perangkat ini belum bisa dimuat.");
        }
      })
      .catch(() => {
        if (active) setHistoryError("Riwayat di perangkat ini belum bisa dimuat.");
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [brandSlug]);

  const pick = (ref: string) => {
    void run(ref);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const csUrl = waLink(
    waCs,
    `Halo CS ${brandName}, saya butuh bantuan terkait transaksi.`,
  );

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
              void run(q);
            }}
            className="mt-7 card p-2 flex flex-col sm:flex-row gap-2 shadow-[0_20px_50px_-25px_rgba(30,40,110,.4)]"
          >
            <input
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 px-4 py-3 outline-none min-w-0"
              placeholder="Kode referensi atau nomor tujuan"
              aria-label="Kode referensi atau nomor tujuan"
            />
            <button className="btn" disabled={loading}>
              {loading ? "Mencari…" : "Cek Status"}
            </button>
          </form>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-5 py-10 min-h-[40vh]">
        <div>
          {loading && (
            <div className="card p-8 text-center text-[#6b7394]">
              Mencari transaksi…
            </div>
          )}

          {!loading && error && (
            <div className="card p-8 text-center">
              <div className="font-bold">Layanan lagi gangguan</div>
              <p className="text-sm text-[#6b7394] mt-1">{error}</p>
              <button
                type="button"
                onClick={() => void run(q)}
                className="btn btn-ghost mt-4"
              >
                Coba lagi
              </button>
            </div>
          )}

          {!loading && !error && searched && hits.length === 0 && (
            <div className="card p-8 text-center">
              <div className="text-4xl">🔍</div>
              <div className="font-bold mt-2">Transaksi tidak ditemukan</div>
              <p className="text-sm text-[#6b7394] mt-1">
                Periksa lagi kode referensi atau nomor tujuan.
              </p>
              {csUrl ? (
                <a
                  href={csUrl}
                  target="_blank"
                  rel="noopener"
                  className="btn btn-ghost mt-4"
                >
                  Hubungi CS
                </a>
              ) : null}
            </div>
          )}

          {!loading && !error && searched && hits.length === 1 && (
            <TxDetail order={hits[0]} />
          )}

          {!loading && !error && searched && hits.length > 1 && (
            <div>
              <div className="font-bold mb-3">{hits.length} transaksi ditemukan</div>
              <div className="space-y-3">
                {hits.map((order) => (
                  <TxCard
                    key={order.ref}
                    order={order}
                    services={services}
                    onPick={pick}
                  />
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
            {historyLoading ? (
              <div className="card p-8 text-center text-[#6b7394]">
                Memuat riwayat…
              </div>
            ) : history.length > 0 ? (
              history.map((order) => (
                <TxCard
                  key={order.ref}
                  order={order}
                  services={services}
                  onPick={pick}
                />
              ))
            ) : historyError ? (
              <div className="card p-8 text-center text-[#6b7394]">
                {historyError}
              </div>
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
