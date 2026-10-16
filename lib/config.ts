/**
 * Konfigurasi umum — ubah di sini kalau ada yang berganti.
 */
export const SITE_NAME = "Ludovex Digital";
export const SITE_TAGLINE = "Semua pembayaran digital, satu tempat";

/** Ganti dengan domain produksi (tanpa trailing slash). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ludovexdigital.id";

/** Nomor WhatsApp CS dalam format 62xxxxxxxxxx (tanpa + / spasi). */
export const CS_WA = "6285711172317";

/** Nomor tampilan untuk teks di halaman. */
export const CS_PHONE_DISPLAY = "0857-1117-2317";

/**
 * Gambar QRIS statis (dipakai khusus metode QRIS).
 * Ganti dengan file di public/ (mis. /images/qris.png) atau URL backend kamu.
 * Kalau kosong / gagal dimuat, akan tampil QR placeholder.
 */
export const QRIS_IMAGE =
  "https://res.cloudinary.com/dqjh7utdb/image/upload/v1792161327/camhvfeu1lcm0ps8ieiz.jpg";

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
