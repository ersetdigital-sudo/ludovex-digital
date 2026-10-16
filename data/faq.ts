export type FaqItem = [question: string, answer: string];
export type FaqGroup = [id: string, title: string, items: FaqItem[]];

export const FAQ: FaqGroup[] = [
  [
    "bayar",
    "Pembayaran",
    [
      [
        "Metode pembayaran apa saja yang tersedia?",
        "Saat ini pembayaran utama melalui QRIS. Scan QRIS dengan aplikasi bank atau e-wallet apa pun (DANA, OVO, GoPay, ShopeePay, m-banking).",
      ],
      [
        "Kenapa harus memasukkan nominal persis?",
        "QRIS kami bersifat statis, jadi nominal diketik manual. Nominal yang persis sama dengan total memudahkan tim kami mencocokkan pembayaran Anda.",
      ],
      [
        'Saya sudah bayar, kenapa statusnya masih "Sedang dicek"?',
        'Setiap pembayaran diverifikasi manual oleh tim kami. Agar lebih cepat, klik "Konfirmasi via WhatsApp" dan kirim bukti pembayaran.',
      ],
    ],
  ],
  [
    "tx",
    "Transaksi",
    [
      [
        "Bagaimana cara cek status transaksi?",
        "Buka menu Cek Transaksi, lalu masukkan kode referensi (REF-LDX…) atau nomor tujuan.",
      ],
      [
        "Berapa lama transaksi diproses?",
        "Transaksi diproses setelah pembayaran terverifikasi. Hubungi CS jika status belum berubah.",
      ],
      [
        "Saya salah memasukkan nomor tujuan, bagaimana?",
        "Segera hubungi CS via WhatsApp dengan menyertakan kode referensi. Transaksi yang sudah terkirim ke nomor yang salah tidak selalu dapat dibatalkan.",
      ],
    ],
  ],
  [
    "refund",
    "Gagal & Refund",
    [
      [
        "Bagaimana jika transaksi gagal?",
        "Jika transaksi gagal setelah pembayaran terverifikasi, dana akan dikembalikan atau transaksi diproses ulang setelah konfirmasi dengan CS.",
      ],
      [
        "Token PLN belum masuk, apa yang harus dilakukan?",
        "Cek status di menu Cek Transaksi. Jika sudah lama belum ada token, hubungi CS dengan kode referensi Anda.",
      ],
    ],
  ],
  [
    "promo",
    "Promo & Voucher",
    [
      [
        "Bagaimana cara memakai kode voucher?",
        'Masukkan kode di kolom "Kode voucher" pada ringkasan transaksi lalu klik Pakai. Potongan langsung terlihat di total.',
      ],
      [
        "Kenapa voucher saya tidak bisa dipakai?",
        "Setiap voucher punya syarat, misalnya hanya untuk layanan tertentu atau minimal transaksi. Pesan di bawah kolom voucher akan menjelaskan alasannya.",
      ],
    ],
  ],
  [
    "akun",
    "Keamanan",
    [
      [
        "Apakah data saya aman?",
        "Kami hanya menggunakan data yang diperlukan untuk memproses transaksi. Selengkapnya di halaman Kebijakan Privasi.",
      ],
      [
        "Apakah CS akan meminta PIN atau OTP?",
        "Tidak pernah. Jangan bagikan PIN, kata sandi, atau kode OTP kepada siapa pun yang mengaku sebagai CS Ludovex Digital.",
      ],
    ],
  ],
];

/** FAQ singkat di homepage */
export const HOME_FAQ: FaqItem[] = [
  ["Berapa lama transaksi diproses?", "Umumnya kurang dari 1 menit setelah pembayaran terkonfirmasi."],
  [
    "Metode pembayaran apa saja?",
    "QRIS, DANA, OVO, GoPay, ShopeePay, dan virtual account bank.",
  ],
  [
    "Bagaimana cara cek status transaksi?",
    "Buka menu Cek Transaksi lalu masukkan kode referensi atau nomor tujuan.",
  ],
  [
    "Bagaimana jika transaksi gagal?",
    "Dana dikembalikan otomatis, dan CS kami siap membantu 24 jam.",
  ],
];
