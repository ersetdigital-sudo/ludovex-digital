export type Tx = {
  ref: string;
  /** nama layanan, contoh "Token PLN" */
  svc: string;
  /** id service, contoh "pln" — dipakai untuk ikon/warna */
  svcId: string;
  prod: string;
  no: string;
  method: string;
  admin: number;
  total: number;
  disc: number;
  voucher: string | null;
  time: string;
  status: "Menunggu" | "Diproses" | "Sukses";
  sn: string;
};

const KEY = "ldx_tx";
const MAX = 30;

/** Aman dipanggil di client saja. */
export function readTx(): Tx[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Tx[];
  } catch {
    return [];
  }
}

export function saveTx(tx: Tx) {
  if (typeof window === "undefined") return;
  const list = readTx();
  list.unshift(tx);
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* storage penuh / private mode */
  }
}

export function setStored(key: "ldx_svc" | "ldx_no" | "ldx_q" | "ldx_voucher", value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function getStored(key: "ldx_svc" | "ldx_no" | "ldx_voucher" | "ldx_q") {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function removeStored(key: "ldx_svc" | "ldx_no" | "ldx_q" | "ldx_voucher") {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
