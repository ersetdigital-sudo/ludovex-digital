"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SERVICES, routeOf } from "@/data/services";

/** urutan opsi select hero (sesuai HTML asli) */
const DROPDOWN_ORDER = ["pulsa", "data", "pln", "wallet", "pdam", "bpjs", "inet", "fin"];

/** Form cepat di hero: pilih layanan + nomor, langsung ke halaman transaksi. */
export function QuickPayForm() {
  const router = useRouter();
  const [svc, setSvc] = useState("pulsa");
  const [no, setNo] = useState("");

  const options = DROPDOWN_ORDER.map((id) => SERVICES.find((s) => s.id === id)!).filter(
    Boolean,
  );

  return (
    <form
      className="mt-8 card p-2 flex flex-col sm:flex-row gap-2 max-w-lg shadow-[0_20px_50px_-25px_rgba(30,40,110,.4)]"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/${routeOf(svc)}?no=${encodeURIComponent(no.trim())}`);
      }}
    >
      <select
        name="layanan"
        value={svc}
        onChange={(e) => setSvc(e.target.value)}
        className="sm:w-40 rounded-xl bg-[#f4f6fd] px-3 py-3 font-semibold text-sm outline-none"
      >
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input
        name="no"
        inputMode="numeric"
        value={no}
        onChange={(e) => setNo(e.target.value)}
        placeholder="Masukkan nomor / ID pelanggan"
        className="flex-1 px-3 py-3 outline-none text-sm min-w-0"
      />
      <button className="btn py-3">Lanjut</button>
    </form>
  );
}

/** Form cek status di homepage. */
export function QuickCekForm() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      className="flex flex-col sm:flex-row gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/cek?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <input
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="field"
        placeholder="REF-LDX12345678 atau 0812…"
      />
      <button className="btn shrink-0">Cek Status</button>
    </form>
  );
}

/** Tombol salin voucher promo. */
export function CopyVoucher({ code = "LUDOBARU" }: { code?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      localStorage.setItem("ldx_voucher", code);
    } catch {
      /* ignore */
    }
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(code);
      else throw new Error("fallback");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="bg-white text-[#3b4fd8] text-xs font-bold rounded-lg px-3 py-2 cursor-pointer hover:bg-[#eef0ff] active:scale-95 transition"
    >
      {copied ? "Tersalin ✓" : "Salin"}
    </button>
  );
}
