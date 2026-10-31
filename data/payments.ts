export type PayType = "qr" | "ew" | "va";

export type PayMethod = {
  id: string;
  name: string;
  fee: number;
  type: PayType;
};

export type Operator = {
  name: string;
  color: string;
  prefixes: string[];
};

/** Daftar operator tetap di kode; ini data statis, bukan katalog dashboard. */
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
