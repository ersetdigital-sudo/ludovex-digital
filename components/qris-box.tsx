"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { QRIS_IMAGE } from "@/lib/config";

/** QR pattern deterministik — dipakai kalau gambar QRIS belum tersedia. */
function PlaceholderQr() {
  const cells: { x: number; y: number }[] = [];
  let s = 7;
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      s = (s * 9301 + 49297) % 233280;
      const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      const on = finder
        ? x % 14 === 0 || x % 14 === 6 || y % 14 === 0 || y % 14 === 6 || (x % 14 > 1 && x % 14 < 5 && y % 14 > 1 && y % 14 < 5)
        : s / 233280 > 0.5;
      if (on) cells.push({ x, y });
    }
  }

  return (
    <svg
      viewBox="0 0 21 21"
      className="w-48 h-48 mx-auto"
      shapeRendering="crispEdges"
      role="img"
      aria-label="Kode QR pembayaran"
    >
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width="1" height="1" fill="#16204a" />
      ))}
    </svg>
  );
}

/** Kotak QRIS + catatan nominal. */
export function QrisBox({ amount }: { amount: string }) {
  const [failed, setFailed] = useState(false);
  const ready = !!QRIS_IMAGE && !failed;

  return (
    <div>
      {ready ? (
        <Image
          src={QRIS_IMAGE}
          alt="QRIS Ludovex"
          width={300}
          height={300}
          unoptimized
          onError={() => setFailed(true)}
          className="w-full max-w-[300px] h-auto mx-auto rounded-2xl border border-[#e7e9f5] shadow-sm"
        />
      ) : (
        <PlaceholderQr />
      )}

      {ready && (
        <a
          href={QRIS_IMAGE}
          download="QRIS-Ludovex.png"
          target="_blank"
          rel="noopener"
          className="inline-block mt-3 text-sm font-bold text-[#3b4fd8]"
        >
          ⬇ Unduh QRIS
        </a>
      )}

      <div className="mt-3 text-left text-sm bg-[#fff8eb] rounded-xl p-3 text-[#7a4b06]">
        <b>Penting:</b> scan pakai aplikasi bank/e-wallet, lalu masukkan nominal{" "}
        <b>persis {amount}</b> agar pembayaran mudah dicek.
      </div>
    </div>
  );
}
