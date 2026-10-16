"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon, type IconName } from "./icon";
import { QrisBox } from "./qris-box";
import { ACTIVE_PAY_METHODS, OPERATORS, VOUCHERS } from "@/data/payments";
import { SERVICES, type ProductItem, type Service, serviceById } from "@/data/services";
import { fmtCountdown, fmtDate, rp, waConfirmLink } from "@/lib/format";
import { getStored, removeStored, saveTx, setStored, type Tx } from "@/lib/tx";

type Step = 1 | 2 | 3;

const digits = (s: string) => s.replace(/\D/g, "");

export function TransactionFlow({
  fixedService = null,
  initialNo = "",
  initialVoucher = "",
}: {
  fixedService?: Service | null;
  initialNo?: string;
  initialVoucher?: string;
}) {
  const [svcId, setSvcId] = useState<string>(fixedService?.id ?? SERVICES[0].id);
  const [num, setNum] = useState(initialNo);
  const [item, setItem] = useState<ProductItem | null>(null);
  const [pay, setPay] = useState(0);
  const [voucher, setVoucher] = useState<string | null>(null);
  const [voucherInput, setVoucherInput] = useState("");
  const [invalidCode, setInvalidCode] = useState(false);
  const [showErr, setShowErr] = useState(false);
  const [checking, setChecking] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [countdown, setCountdown] = useState(900);
  const [tx, setTx] = useState<Tx | null>(null);
  const [verifying, setVerifying] = useState(false);

  const cur: Service = fixedService ?? serviceById(svcId) ?? SERVICES[0];
  const method = ACTIVE_PAY_METHODS[pay] ?? ACTIVE_PAY_METHODS[0];
  const valid = digits(num).length >= 8;

  /** potongan voucher */
  const disc = useMemo(() => {
    if (!voucher || !item) return 0;
    const v = VOUCHERS[voucher];
    if (!v) return 0;
    if (v.only && !v.only.includes(cur.id)) return 0;
    if (v.min && item[1] < v.min) return 0;
    return v.pct ? Math.min(Math.round((item[1] * v.pct) / 100), v.max ?? 0) : v.flat ?? 0;
  }, [voucher, item, cur.id]);

  const total = item ? Math.max(0, item[1] + method.fee - disc) : 0;

  /** deteksi operator dari awalan nomor */
  const operator = useMemo(() => {
    const isHp = cur.id === "pulsa" || cur.id === "data";
    let d = digits(num);
    if (d.startsWith("62")) d = "0" + d.slice(2);
    else if (d.startsWith("8")) d = "0" + d;
    if (!isHp || d.length < 4) return { found: null as null | (typeof OPERATORS)[number], unknown: false };
    const found = OPERATORS.find((o) => o.prefixes.includes(d.slice(0, 4))) ?? null;
    return { found, unknown: !found };
  }, [num, cur.id]);

  const title = fixedService
    ? `${fixedService.bill ? "Bayar " : "Beli "}${fixedService.name}`
    : "Transaksi";

  /* ---------- efek ---------- */

  // ambil layanan / nomor / voucher tersimpan saat pertama buka
  useEffect(() => {
    if (!fixedService) {
      const s = getStored("ldx_svc");
      if (s && serviceById(s)) setSvcId(s);
    }
    if (!initialNo) {
      const n = getStored("ldx_no");
      if (n) setNum(n);
      removeStored("ldx_no");
    }
    const v = (initialVoucher || getStored("ldx_voucher") || "").trim().toUpperCase();
    if (v) {
      setVoucherInput(v);
      if (VOUCHERS[v]) setVoucher(v);
      else setInvalidCode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // hitung mundur di langkah pembayaran
  useEffect(() => {
    if (step !== 2) return;
    setCountdown(900);
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [step]);

  // selalu mulai dari atas saat ganti langkah
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  /* ---------- aksi ---------- */

  const pickService = (id: string) => {
    setSvcId(id);
    setItem(null);
    setShowErr(false);
    setStored("ldx_svc", id);
  };

  const checkBill = () => {
    if (!valid) {
      setShowErr(true);
      return;
    }
    setChecking(true);
    setTimeout(() => {
      const amount = (Math.floor(Math.random() * 40) + 8) * 5000;
      setItem([`Tagihan ${cur.name}`, amount]);
      setChecking(false);
    }, 700);
  };

  const applyVoucher = (raw?: string) => {
    const code = (raw ?? voucherInput).trim().toUpperCase();
    if (!code) {
      setVoucher(null);
      setInvalidCode(false);
      setVoucherInput("");
      return;
    }
    setVoucherInput(code);
    if (!VOUCHERS[code]) {
      setVoucher(null);
      setInvalidCode(true);
      return;
    }
    setInvalidCode(false);
    setVoucher(code);
  };

  const toggleVoucher = () => {
    if (voucher) {
      setVoucher(null);
      setInvalidCode(false);
      setVoucherInput("");
    } else {
      applyVoucher();
    }
  };

  const goPay = () => {
    if (!valid || !item) {
      setShowErr(true);
      return;
    }
    setTx({
      ref: "REF-LDX" + Date.now().toString().slice(-8),
      svc: cur.name,
      svcId: cur.id,
      prod: item[0],
      no: num.trim(),
      method: method.name,
      admin: method.fee,
      total,
      disc,
      voucher: disc ? voucher : null,
      time: new Date().toISOString(),
      status: "Menunggu",
      sn: "",
    });
    setStep(2);
  };

  const confirmPaid = () => {
    if (!tx) return;
    setVerifying(true);
    setTimeout(() => {
      setTx({ ...tx, status: "Diproses", sn: "Dikirim setelah verifikasi" });
      saveTx({ ...tx, status: "Diproses", sn: "Dikirim setelah verifikasi" });
      setVerifying(false);
      setStep(3);
    }, 1200);
  };

  /* ---------- pesan voucher ---------- */
  const vMsg = (() => {
    if (invalidCode) return { cls: "text-red-500", text: "Kode voucher tidak valid." };
    if (!voucher) return null;
    const v = VOUCHERS[voucher];
    if (!item)
      return {
        cls: "text-[#6b7394]",
        text: `Voucher ${voucher} dipasang. Pilih produk untuk melihat potongan.`,
      };
    if (disc) return { cls: "text-[#16835e] font-semibold", text: `✓ ${v.label}` };
    if (v.only && !v.only.includes(cur.id))
      return {
        cls: "text-[#c25a17]",
        text: "Voucher hanya untuk pulsa, paket data & token PLN.",
      };
    return { cls: "text-[#c25a17]", text: `Minimal transaksi ${rp(v.min ?? 0)}.` };
  })();

  const stepCls = (i: Step) => "step" + (step > i ? " done" : step === i ? " on" : "");

  return (
    <main className="max-w-6xl mx-auto px-5 py-8 md:py-12">
      {/* judul */}
      <div className="flex items-center gap-4">
        {fixedService && (
          <span className={`rounded-2xl p-3 w-14 h-14 shrink-0 t-${fixedService.tone}`}>
            <Icon name={fixedService.id as IconName} />
          </span>
        )}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">{title}</h1>
          {fixedService && (
            <Link href="/#layanan" className="text-sm font-semibold text-[#3b4fd8]">
              ← Ganti layanan
            </Link>
          )}
        </div>
      </div>

      {/* stepper */}
      <div className="mt-6 card px-5 py-4 flex items-center gap-3">
        <div className={stepCls(1)}>
          <span className="n">{step > 1 ? "✓" : 1}</span>
          <span className="hidden sm:inline">Isi data</span>
        </div>
        <div className={"bar" + (step > 1 ? " done" : "")} />
        <div className={stepCls(2)}>
          <span className="n">{step > 2 ? "✓" : 2}</span>
          <span className="hidden sm:inline">Pembayaran</span>
        </div>
        <div className={"bar" + (step > 2 ? " done" : "")} />
        <div className={stepCls(3)}>
          <span className="n">3</span>
          <span className="hidden sm:inline">Verifikasi</span>
        </div>
      </div>

      {/* ============================ LANGKAH 1 ============================ */}
      {step === 1 && (
        <section className="mt-6">
          {!fixedService && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickService(s.id)}
                  className={`opt py-2 px-4 whitespace-nowrap font-semibold text-sm flex items-center gap-2 ${
                    s.id === cur.id ? "active" : ""
                  }`}
                >
                  <Icon name={s.id as IconName} className="w-5 h-5" />
                  {s.name}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 grid lg:grid-cols-[1fr_360px] gap-6 items-start">
            {/* form */}
            <div className="card p-6 md:p-8 space-y-7">
              <div>
                <label htmlFor="num" className="font-bold block mb-2">
                  {cur.field}
                </label>
                <div className="relative">
                  <input
                    id="num"
                    className="field pr-36"
                    inputMode="numeric"
                    value={num}
                    onChange={(e) => {
                      setNum(e.target.value.replace(/[^\d +]/g, ""));
                      setShowErr(false);
                    }}
                    placeholder={cur.placeholder}
                  />
                  {operator.found && (
                    <span
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-white"
                      style={{
                        background: operator.found.color,
                        color: operator.found.name === "Indosat" ? "#16204a" : "#fff",
                      }}
                    >
                      <span className="w-4 h-4 rounded-full bg-white/30 grid place-items-center text-[9px]">
                        {operator.found.name[0]}
                      </span>
                      {operator.found.name}
                    </span>
                  )}
                </div>
                {operator.unknown && (
                  <p className="text-xs text-[#6b7394] mt-2">
                    Operator tidak dikenali, periksa kembali nomor HP.
                  </p>
                )}
                <p className={`text-red-500 text-sm mt-2 ${showErr && !valid ? "" : "hidden"}`}>
                  Mohon isi nomor dengan benar (min. 8 digit).
                </p>
              </div>

              {/* nominal / cek tagihan */}
              <div>
                <div className="font-bold mb-3">{cur.bill ? "Cek tagihan" : "Pilih nominal"}</div>
                {cur.bill ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={checkBill} disabled={checking} className="btn btn-ghost col-span-2">
                      {checking ? "Mengecek…" : item ? "Cek Ulang" : "Cek Tagihan"}
                    </button>
                    {item && (
                      <div className="opt active col-span-2 flex justify-between items-center">
                        <span>
                          <b>Tagihan bulan ini</b>
                          <br />
                          <span className="text-xs text-[#6b7394]">
                            a.n. Pelanggan ****{digits(num).slice(-4)}
                          </span>
                        </span>
                        <b className="text-[#3b4fd8]">{rp(item[1])}</b>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {cur.items?.map((it) => (
                      <button
                        key={it[0]}
                        type="button"
                        onClick={() => setItem(it)}
                        className={`opt ${item?.[0] === it[0] ? "active" : ""}`}
                      >
                        <div className="font-semibold">{it[0]}</div>
                        <div className="text-[#3b4fd8] font-bold mt-1">{rp(it[1])}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* metode bayar */}
              <div>
                <div className="font-bold mb-3">Metode pembayaran</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ACTIVE_PAY_METHODS.map((p, i) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setPay(i)}
                      className={`opt ${i === pay ? "active" : ""}`}
                    >
                      <div className="font-semibold text-sm">{p.name}</div>
                      <div className="text-xs text-[#6b7394]">
                        {p.fee ? `Admin ${rp(p.fee)}` : "Gratis admin"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ringkasan */}
            <aside className="card p-6 lg:sticky lg:top-24">
              <div className="font-bold text-lg">Ringkasan</div>
              <div className="mt-4 space-y-3 text-sm">
                <Row label="Layanan" value={cur.name} />
                <Row label="Nomor" value={num || "-"} />
                <Row label="Produk" value={item ? item[0] : "-"} alignRight />
                <Row label="Metode" value={method.name} />
                <Row label="Biaya admin" value={item ? rp(method.fee) : "Rp0"} />
              </div>

              <div className="mt-5">
                <label htmlFor="voucher" className="text-sm font-bold block mb-2">
                  Kode voucher
                </label>
                <div className="flex gap-2">
                  <input
                    id="voucher"
                    className="field py-2.5 text-sm uppercase font-mono"
                    placeholder="Contoh: LUDOBARU"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        toggleVoucher();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={toggleVoucher}
                    className="btn btn-ghost py-2 px-4 text-sm shrink-0"
                  >
                    {voucher ? "Hapus" : "Pakai"}
                  </button>
                </div>
                {vMsg && <p className={`text-xs mt-2 ${vMsg.cls}`}>{vMsg.text}</p>}
              </div>

              {disc > 0 && (
                <div className="mt-3 text-sm flex justify-between">
                  <span className="text-[#16835e] font-semibold">Diskon voucher</span>
                  <b className="text-[#16835e]">-{rp(disc)}</b>
                </div>
              )}

              <div className="border-t border-dashed border-[#d9dcf0] my-5" />
              <div className="flex justify-between items-end">
                <span className="text-[#6b7394]">Total</span>
                <span className="text-2xl font-extrabold text-[#3b4fd8]">{rp(total)}</span>
              </div>

              <button
                type="button"
                onClick={goPay}
                disabled={!item}
                className="btn w-full mt-6"
              >
                Lanjut ke Pembayaran
              </button>
              <p className="text-xs text-[#6b7394] mt-3 text-center">
                Mode demo, belum terhubung ke payment gateway.
              </p>
            </aside>
          </div>
        </section>
      )}

      {/* ============================ LANGKAH 2 ============================ */}
      {step === 2 && tx && (
        <section className="mt-6">
          <div className="max-w-xl mx-auto card p-6 md:p-8 text-center">
            <div className="flex justify-between items-center text-sm">
              <span className="badge b-wait">Menunggu pembayaran</span>
              <span className="font-semibold text-[#6b7394]">
                Sisa waktu <b className="text-[#16204a]">{fmtCountdown(countdown)}</b>
              </span>
            </div>

            <div className="mt-6 text-[#6b7394] text-sm">Total pembayaran</div>
            <div className="text-3xl font-extrabold text-[#3b4fd8]">{rp(tx.total)}</div>

            <div className="mt-6">
              {method.type === "qr" && <QrisBox amount={rp(tx.total)} />}
              {method.type === "va" && (
                <div>
                  <div className="text-sm text-[#6b7394]">Nomor Virtual Account</div>
                  <div className="mt-1 text-2xl font-extrabold font-mono tracking-wider">
                    8808 {tx.ref.slice(-8, -4)} {tx.ref.slice(-4)} 21
                  </div>
                  <p className="text-sm text-[#6b7394] mt-3">
                    Transfer lewat m-banking / ATM sesuai total di atas.
                  </p>
                </div>
              )}
              {method.type === "ew" && (
                <div>
                  <div className="w-16 h-16 mx-auto rounded-2xl t-purple p-4">
                    <Icon name="wallet" />
                  </div>
                  <p className="text-sm text-[#6b7394] mt-3">
                    Notifikasi pembayaran dikirim ke aplikasi <b>{method.name}</b> kamu. Buka
                    aplikasi lalu konfirmasi.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 text-left bg-[#f4f6fd] rounded-2xl p-4 text-sm space-y-1.5">
              <Row label="Produk" value={tx.prod} bold alignRight />
              <Row label="Nomor tujuan" value={tx.no} bold />
              <Row label="Kode referensi" value={tx.ref} bold mono />
            </div>

            <button type="button" onClick={confirmPaid} disabled={verifying} className="btn w-full mt-6">
              {verifying ? "Memverifikasi…" : "Saya Sudah Bayar"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full mt-3 text-sm font-semibold text-[#6b7394]"
            >
              ← Ubah pesanan
            </button>
          </div>
        </section>
      )}

      {/* ============================ LANGKAH 3 ============================ */}
      {step === 3 && tx && (
        <section className="mt-6">
          <div className="max-w-md mx-auto card overflow-hidden">
            <div
              className="p-8 text-center text-white"
              style={{ background: "linear-gradient(135deg,#3b4fd8,#7a5cf2)" }}
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-white text-[#b7700b] p-4 animate-pulse">
                <Icon name="clock" />
              </div>
              <h2 className="text-2xl font-extrabold mt-4">Terima kasih!</h2>
              <p className="text-white/90 mt-1">Pembayaran Anda sedang dalam pengecekan.</p>
              <p className="text-white/70 text-xs mt-2">{fmtDate(tx.time)}</p>
            </div>

            <div className="p-6 text-sm space-y-3">
              <Row
                label="Status"
                value={<span className="badge b-wait">Sedang dicek</span>}
                alignRight
              />
              <Row label="Kode referensi" value={tx.ref} bold mono alignRight />
              <Row label="Layanan" value={tx.svc} bold alignRight />
              <Row label="Produk" value={tx.prod} bold alignRight />
              <Row label="Nomor tujuan" value={tx.no} bold alignRight />
              <Row label="Metode" value={tx.method} bold alignRight />
              <Row
                label={/PLN/.test(tx.svc) ? "Token" : "Serial number"}
                value={tx.sn}
                bold
                mono
                accent
                alignRight
              />
              {tx.disc > 0 && (
                <Row
                  label={`Voucher ${tx.voucher}`}
                  value={`-${rp(tx.disc)}`}
                  bold
                  accentGreen
                  alignRight
                />
              )}
              <div className="border-t border-dashed border-[#d9dcf0]" />
              <Row
                label="Total dibayar"
                value={rp(tx.total)}
                bold
                accent
                alignRight
                big
              />
              <p className="text-xs text-[#6b7394] bg-[#fff8eb] rounded-xl p-3 mt-2">
                Verifikasi biasanya 1–5 menit. Simpan kode referensi dan pantau statusnya di menu
                Cek Transaksi.
              </p>
            </div>

            <div className="px-6">
              <a
                href={waConfirmLink({
                  ref: tx.ref,
                  prod: tx.prod,
                  no: tx.no,
                  method: tx.method,
                  total: rp(tx.total),
                })}
                target="_blank"
                rel="noopener"
                className="btn w-full"
                style={{ background: "#25d366", boxShadow: "0 10px 24px -10px rgba(37,211,102,.7)" }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
                </svg>
                Konfirmasi via WhatsApp
              </a>
              <p className="text-xs text-center text-[#6b7394] mt-2 mb-4">
                Kirim bukti bayar ke CS agar verifikasi lebih cepat.
              </p>
            </div>

            <div className="px-6 pb-6 grid grid-cols-2 gap-3">
              <Link
                href={`/cek?q=${encodeURIComponent(tx.ref)}`}
                onClick={() => setStored("ldx_q", tx.ref)}
                className="btn btn-ghost"
              >
                Cek Status
              </Link>
              <Link href="/bayar" className="btn">
                Transaksi Lagi
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
  accent,
  accentGreen,
  alignRight,
  big,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
  mono?: boolean;
  accent?: boolean;
  accentGreen?: boolean;
  alignRight?: boolean;
  big?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#6b7394] shrink-0">{label}</span>
      <span
        className={[
          bold ? "font-semibold" : "",
          mono ? "font-mono" : "",
          accent ? "text-[#3b4fd8]" : "",
          accentGreen ? "text-[#16835e]" : "",
          big ? "text-lg font-extrabold" : "",
          alignRight ? "text-right" : "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
