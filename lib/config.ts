/**
 * Konfigurasi statis web. Data brand (nama, tagline, WA, QRIS)
 * dibaca dari database lewat lib/db, bukan dari file ini.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** Label strip metode bayar di footer. Ini hanya teks logo, bukan data transaksi. */
export const PAYMENT_METHODS_LABEL = ["QRIS", "DANA", "OVO", "GoPay", "VA Bank"];

export const BRAND_STRIP = [
  "QRIS",
  "DANA",
  "OVO",
  "GoPay",
  "ShopeePay",
  "BCA",
  "BRI",
  "Mandiri",
];
