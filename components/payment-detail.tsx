"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyButton } from "./copy-button";
import { Icon } from "./icon";
import { QrisBox } from "./qris-box";
import { PUBLIC_STATUS } from "@/lib/db/status";
import type { PaymentInfo } from "@/lib/db/types";
import { fmtCountdown, fmtDate, rp, waConfirmLink } from "@/lib/format";

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

export function PaymentDetail({
  payment,
  sn = null,
}: {
  payment: PaymentInfo;
  sn?: string | null;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (payment.status !== "menunggu_bayar" || !payment.expires_at) {
      setRemaining(null);
      return;
    }
    const target = new Date(payment.expires_at).getTime();
    const update = () => {
      setRemaining(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [payment.status, payment.expires_at]);

  const expired =
    payment.status === "menunggu_bayar" && remaining !== null && remaining <= 0;
  const status = expired ? "dibatalkan" : payment.status;
  const meta = PUBLIC_STATUS[status];
  const product = payment.nama_produk ?? payment.nama_layanan;
  const totalText = payment.total !== null ? rp(payment.total) : "Belum ditetapkan";
  const cekHref = `/cek?q=${encodeURIComponent(payment.ref)}`;
  const isWaiting = status === "menunggu_bayar";
  const waUrl = waConfirmLink({
    wa: payment.wa_cs,
    brandName: payment.nama_brand,
    ref: payment.ref,
    prod: product,
    no: payment.nomor_tujuan,
    method: payment.metode_bayar ?? "-",
    total: payment.total !== null ? rp(payment.total) : "-",
  });
  const isQr = payment.tipe_metode === "qr";
  const isVa = payment.tipe_metode === "va";
  const isEw = payment.tipe_metode === "ewallet";

  return (
    <div className="max-w-xl mx-auto card p-6 md:p-8 text-center">
      <div className="flex flex-wrap justify-between items-center gap-3 text-sm">
        <span className={meta.badgeClass}>{meta.label}</span>
        {isWaiting && !expired ? (
          <span className="font-semibold text-[#6b7394]">
            Sisa waktu{" "}
            <b className="text-[#16204a]">
              {remaining === null ? "--:--" : fmtCountdown(remaining)}
            </b>
          </span>
        ) : payment.created_at ? (
          <span className="font-semibold text-[#6b7394]">
            {fmtDate(payment.created_at)}
          </span>
        ) : null}
      </div>

      {status === "menunggu_cek" ? (
        <>
          <div className="mt-6 text-[#6b7394] text-sm">Status tagihan</div>
          <div className="text-2xl font-extrabold text-[#b7700b]">
            Lagi dicek admin
          </div>
          <p className="mt-4 text-sm text-[#4b5375] leading-relaxed">
            Tagihan kamu lagi dicek admin pada jam{" "}
            <b>{payment.jam_cek_tagihan || "yang tertera"}</b>. Total tagihan dan link
            pembayaran bakal dikirim lewat WhatsApp.
          </p>
        </>
      ) : null}

      {isWaiting && !expired ? (
        <>
          <div className="mt-6 text-[#6b7394] text-sm">Total pembayaran</div>
          <div className="text-3xl font-extrabold text-[#3b4fd8]">
            {rp(payment.total ?? 0)}
          </div>

          <div className="mt-6">
            {isQr ? (
              <QrisBox
                amount={rp(payment.total ?? 0)}
                qrisImageUrl={payment.qris_image_url}
                brandName={payment.nama_brand}
              />
            ) : isVa ? (
              <div>
                <div className="text-sm text-[#6b7394]">Nomor Virtual Account</div>
                <div className="mt-1 text-2xl font-extrabold font-mono tracking-wider">
                  8808 {payment.ref.slice(-8, -4)} {payment.ref.slice(-4)} 21
                </div>
                <p className="text-sm text-[#6b7394] mt-3">
                  Transfer lewat m-banking / ATM sesuai total di atas.
                </p>
              </div>
            ) : isEw ? (
              <div>
                <div className="w-16 h-16 mx-auto rounded-2xl t-purple p-4">
                  <Icon name="wallet" />
                </div>
                <p className="text-sm text-[#6b7394] mt-3">
                  Notifikasi pembayaran dikirim ke aplikasi{" "}
                  <b>{payment.metode_bayar}</b> kamu. Buka aplikasi lalu konfirmasi.
                </p>
              </div>
            ) : (
              <p className="text-sm text-[#6b7394]">
                Ikuti instruksi dari admin untuk menyelesaikan pembayaran.
              </p>
            )}
          </div>
        </>
      ) : null}

      {status === "sudah_bayar" ? (
        <div className="mt-6 bg-[#f4f6fd] rounded-2xl p-4 text-sm text-[#4b5375] leading-relaxed">
          Pembayaran kamu sudah dikonfirmasi. Admin sedang memproses pesanan ini.
        </div>
      ) : null}

      {status === "sukses" ? (
        <div className="mt-6 bg-[#dcf5ec] rounded-2xl p-4 text-left text-sm text-[#14532d]">
          <div className="text-xs font-bold uppercase tracking-wide text-[#16835e]">
            SN / Token
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <b className="font-mono break-all">{sn ?? "-"}</b>
            {sn ? (
              <CopyButton
                value={sn}
                className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#16835e] hover:bg-[#f0fdf4] active:scale-95 transition"
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {expired ? (
        <div className="mt-6 rounded-2xl bg-[#fff3dc] p-4 text-sm font-semibold text-[#b7700b]">
          Waktu pembayaran habis. Transaksi ini dibatalkan otomatis.
        </div>
      ) : null}

      {status === "dibatalkan" && !expired ? (
        <div className="mt-6 rounded-2xl bg-[#f4f6fd] p-4 text-sm font-semibold text-[#6b7394]">
          Transaksi ini dibatalkan.
        </div>
      ) : null}

      <div className="mt-5 text-left bg-[#f4f6fd] rounded-2xl p-4 text-sm space-y-1.5">
        <Row label="Produk" value={product} bold alignRight />
        <Row label="Nomor tujuan" value={payment.nomor_tujuan} bold />
        <Row
          label="Kode referensi"
          value={
            <span className="inline-flex flex-wrap items-center justify-end gap-2">
              <b className="font-mono break-all">{payment.ref}</b>
              <CopyButton
                value={payment.ref}
                className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-[#3b4fd8] hover:bg-[#eef0ff] active:scale-95 transition"
              />
            </span>
          }
          bold
          alignRight
        />
        <Row label="Metode" value={payment.metode_bayar ?? "-"} bold alignRight />
        <Row label="Biaya admin" value={rp(payment.biaya_admin)} bold alignRight />
        {payment.potongan > 0 ? (
          <Row
            label={payment.voucher_kode ? `Voucher ${payment.voucher_kode}` : "Voucher"}
            value={`-${rp(payment.potongan)}`}
            bold
            accentGreen
            alignRight
          />
        ) : null}
        <Row
          label="Total"
          value={totalText}
          bold
          accent
          alignRight
          big
        />
      </div>

      {isWaiting && !expired ? (
        <>
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener"
              className="btn w-full mt-6"
              style={{
                background: "#25d366",
                boxShadow: "0 10px 24px -10px rgba(37,211,102,.7)",
              }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
              </svg>
              Kirim bukti bayar ke WA
            </a>
          ) : (
            <p className="mt-6 text-sm text-[#b7700b]">
              Nomor WhatsApp CS belum diatur.
            </p>
          )}
          <p className="text-xs text-[#6b7394] bg-[#fff8eb] rounded-xl p-3 mt-3 text-left">
            Pembayaran lagi dicek admin. Pantau statusnya di menu Cek Transaksi pakai
            kode referensi ini.
          </p>
        </>
      ) : null}

      {status === "menunggu_cek" ? (
        <p className="text-xs text-[#6b7394] bg-[#fff8eb] rounded-xl p-3 mt-3 text-left">
          Simpan kode referensi untuk mengecek status. Total tagihan dan link
          pembayaran akan dikirim admin lewat WhatsApp.
        </p>
      ) : null}

      {status === "sukses" ? (
        <p className="text-xs text-[#6b7394] bg-[#f0fdf4] rounded-xl p-3 mt-3 text-left">
          Simpan SN/token ini. Kamu juga bisa mengeceknya kapan saja di menu Cek
          Transaksi.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 mt-5">
        <Link href={cekHref} className="btn btn-ghost">
          Cek Status
        </Link>
        <Link href="/bayar" className="btn">
          Transaksi Lagi
        </Link>
      </div>
    </div>
  );
}
