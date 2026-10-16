export type PayType = "qr" | "ew" | "va";

export type PayMethod = {
  name: string;
  /** biaya admin */
  fee: number;
  type: PayType;
  /** true = disembunyikan dari pilihan user (bisa dinyalakan lagi nanti) */
  hidden?: boolean;
};

export const PAY_METHODS: PayMethod[] = [
  { name: "QRIS", fee: 0, type: "qr" },
  { name: "DANA", fee: 1000, type: "ew", hidden: true },
  { name: "OVO", fee: 1000, type: "ew", hidden: true },
  { name: "GoPay", fee: 1000, type: "ew", hidden: true },
  { name: "ShopeePay", fee: 1000, type: "ew", hidden: true },
  { name: "Virtual Account", fee: 2500, type: "va", hidden: true },
];

/** metode yang tampil di form transaksi (sekarang QRIS saja) */
export const ACTIVE_PAY_METHODS = PAY_METHODS.filter((m) => !m.hidden);

export type Voucher = {
  /** potongan persen */
  pct?: number;
  /** batas potongan untuk pct */
  max?: number;
  /** potongan tetap */
  flat?: number;
  /** minimum transaksi untuk flat */
  min?: number;
  /** batasi layanan tertentu (id service) */
  only?: string[];
  label: string;
};

export const VOUCHERS: Record<string, Voucher> = {
  LUDOBARU: {
    pct: 20,
    max: 20000,
    only: ["pulsa", "data", "pln"],
    label: "Cashback 20% (maks. Rp20.000)",
  },
  HEMAT5: {
    flat: 5000,
    min: 50000,
    label: "Potongan Rp5.000 min. Rp50.000",
  },
};

export type Operator = {
  name: string;
  color: string;
  prefixes: string[];
};

export const OPERATORS: Operator[] = [
  {
    name: "Telkomsel",
    color: "#e4002b",
    prefixes: ["0811", "0812", "0813", "0821", "0822", "0823", "0851", "0852", "0853"],
  },
  {
    name: "Indosat",
    color: "#f7b500",
    prefixes: ["0814", "0815", "0816", "0855", "0856", "0857", "0858"],
  },
  { name: "XL", color: "#0b4ea2", prefixes: ["0817", "0818", "0819", "0859", "0877", "0878"] },
  { name: "Axis", color: "#7b2d8e", prefixes: ["0831", "0832", "0833", "0838"] },
  { name: "Tri", color: "#1d1d1b", prefixes: ["0895", "0896", "0897", "0898", "0899"] },
  {
    name: "Smartfren",
    color: "#e5007e",
    prefixes: ["0881", "0882", "0883", "0884", "0885", "0886", "0887", "0888", "0889"],
  },
  { name: "by.U", color: "#12b7c6", prefixes: ["0851"] },
];
