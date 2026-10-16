import { CS_WA } from "./config";

/** format rupiah: 50500 -> "Rp50.500" */
export const rp = (n: number) => "Rp" + Number(n).toLocaleString("id-ID");

export const waLink = (text: string) =>
  `https://wa.me/${CS_WA}?text=${encodeURIComponent(text)}`;

export const waConfirmLink = (msg: {
  ref: string;
  prod: string;
  no: string;
  method: string;
  total: string;
}) =>
  waLink(
    `Halo CS Ludovex Digital, saya ingin konfirmasi pembayaran:\n\nKode referensi: ${msg.ref}\nProduk: ${msg.prod}\nNomor tujuan: ${msg.no}\nMetode: ${msg.method}\nTotal: ${msg.total}\n\nBukti transfer saya lampirkan. Terima kasih.`,
  );

export const fmtDate = (t: string | number | Date) =>
  new Date(t).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

/** detik -> "15:00" */
export const fmtCountdown = (s: number) =>
  String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

/** ambil digit saja */
export const digits = (s: string) => s.replace(/\D/g, "");
