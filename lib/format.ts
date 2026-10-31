/** format rupiah: 50500 -> "Rp50.500" */
export const rp = (n: number) => "Rp" + Number(n).toLocaleString("id-ID");

/** ambil digit saja */
export const digits = (s: string) => s.replace(/\D/g, "");

export function waDisplay(value: string | null | undefined): string {
  const d = digits(value ?? "");
  if (!d) return "";
  const local = d.startsWith("62") ? `0${d.slice(2)}` : d;
  return local.length >= 10 ? local.replace(/(\d{4})(?=\d)/g, "$1-") : local;
}

export const waLink = (wa: string | null | undefined, text: string): string | null => {
  const d = digits(wa ?? "");
  if (!d) return null;
  const normalized = d.startsWith("0") ? `62${d.slice(1)}` : d;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
};

export const waConfirmLink = (msg: {
  wa?: string | null;
  brandName: string;
  ref: string;
  prod: string;
  no: string;
  method: string;
  total: string;
}): string | null =>
  waLink(
    msg.wa,
    `Halo CS ${msg.brandName}, saya ingin konfirmasi pembayaran:\n\nKode referensi: ${msg.ref}\nProduk: ${msg.prod}\nNomor tujuan: ${msg.no}\nMetode: ${msg.method}\nTotal: ${msg.total}\n\nBukti transfer saya lampirkan. Terima kasih.`,
  );

export const fmtDate = (t: string | number | Date) =>
  new Date(t).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  });

/** detik -> "15:00" */
export const fmtCountdown = (s: number) =>
  String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0") +
  ":" +
  String(Math.max(0, s) % 60).padStart(2, "0");

/** Samakan sebagian nomor untuk tampilan publik / fallback. */
export function maskNomor(value: string): string {
  const text = value.trim();
  if (text.length <= 4) return text;
  if (text.length <= 8) {
    return `${text.slice(0, 2)}${"*".repeat(text.length - 4)}${text.slice(-2)}`;
  }
  return `${text.slice(0, 4)}${"*".repeat(Math.max(0, text.length - 7))}${text.slice(-3)}`;
}
