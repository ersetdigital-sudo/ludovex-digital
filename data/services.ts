export type Tone = "blue" | "purple" | "green" | "peach";

/** [nama produk, harga] */
export type ProductItem = [string, number];

export type Service = {
  /** id internal (dipakai voucher, penyimpanan, deteksi operator) */
  id: string;
  /** slug url, contoh: inet -> /internet */
  route: string;
  name: string;
  tone: Tone;
  /** label input */
  field: string;
  placeholder: string;
  items?: ProductItem[];
  /** layanan tagihan (cek tagihan dulu, bukan pilih nominal) */
  bill?: boolean;
};

export const SERVICES: Service[] = [
  {
    id: "pulsa",
    route: "pulsa",
    name: "Pulsa",
    tone: "blue",
    field: "Nomor HP",
    placeholder: "08xx xxxx xxxx",
    items: [
      ["Pulsa 10.000", 11500],
      ["Pulsa 25.000", 26000],
      ["Pulsa 50.000", 50500],
      ["Pulsa 100.000", 99000],
    ],
  },
  {
    id: "data",
    route: "data",
    name: "Paket Data",
    tone: "purple",
    field: "Nomor HP",
    placeholder: "08xx xxxx xxxx",
    items: [
      ["5 GB / 30 hari", 35000],
      ["12 GB / 30 hari", 60000],
      ["25 GB / 30 hari", 95000],
      ["Unlimited Harian", 120000],
    ],
  },
  {
    id: "pln",
    route: "pln",
    name: "Token PLN",
    tone: "green",
    field: "ID Pelanggan / No. Meter",
    placeholder: "11 digit nomor meter",
    items: [
      ["Token 20.000", 21500],
      ["Token 50.000", 51500],
      ["Token 100.000", 101500],
      ["Token 200.000", 201500],
    ],
  },
  {
    id: "pdam",
    route: "pdam",
    name: "PDAM",
    tone: "peach",
    field: "Nomor Pelanggan",
    placeholder: "Nomor pelanggan PDAM",
    bill: true,
  },
  {
    id: "bpjs",
    route: "bpjs",
    name: "BPJS",
    tone: "blue",
    field: "Nomor VA Keluarga",
    placeholder: "8888 xxxx xxxx xxxx",
    bill: true,
  },
  {
    id: "inet",
    route: "internet",
    name: "Internet & TV",
    tone: "purple",
    field: "ID Pelanggan",
    placeholder: "ID pelanggan provider",
    bill: true,
  },
  {
    id: "wallet",
    route: "ewallet",
    name: "E-Wallet",
    tone: "green",
    field: "Nomor HP terdaftar",
    placeholder: "08xx xxxx xxxx",
    items: [
      ["Top up 50.000", 51000],
      ["Top up 100.000", 101000],
      ["Top up 200.000", 201000],
      ["Top up 500.000", 501000],
    ],
  },
  {
    id: "fin",
    route: "multifinance",
    name: "Multifinance",
    tone: "peach",
    field: "Nomor Kontrak",
    placeholder: "Nomor kontrak cicilan",
    bill: true,
  },
];

export const serviceById = (id?: string | null) =>
  SERVICES.find((s) => s.id === id) ?? null;

export const serviceByRoute = (route?: string | null) =>
  SERVICES.find((s) => s.route === route) ?? null;

/** terima id ("inet") atau slug url ("internet") */
export const resolveService = (value?: string | null) =>
  serviceById(value) ?? serviceByRoute(value);

/** dipakai tombol "cegah typo" di homepage */
export const routeOf = (id: string) => serviceById(id)?.route ?? "bayar";

/** populer di homepage: [label, sub, harga, route] */
export const POPULAR = [
  {
    icon: "pulsa" as const,
    tone: "blue" as Tone,
    title: "Pulsa 50.000",
    sub: "Semua operator",
    price: "Rp50.500",
    route: "pulsa",
  },
  {
    icon: "data" as const,
    tone: "purple" as Tone,
    title: "Data 12 GB",
    sub: "Aktif 30 hari",
    price: "Rp60.000",
    route: "data",
  },
  {
    icon: "pln" as const,
    tone: "green" as Tone,
    title: "Token PLN 100.000",
    sub: "Token langsung masuk",
    price: "Rp101.500",
    route: "pln",
  },
];
