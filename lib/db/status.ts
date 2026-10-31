import type { OrderStatus } from "./types";

export const ORDER_STATUS_SET: OrderStatus[] = [
  "menunggu_cek",
  "menunggu_bayar",
  "sudah_bayar",
  "sukses",
  "dibatalkan",
];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUS_SET.includes(value as OrderStatus);
}

export const PUBLIC_STATUS: Record<
  OrderStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  menunggu_cek: {
    label: "Lagi dicek admin",
    badgeClass: "badge b-wait",
    dotClass: "bg-[#f5a623]",
  },
  menunggu_bayar: {
    label: "Menunggu pembayaran",
    badgeClass: "badge b-wait",
    dotClass: "bg-[#f5a623]",
  },
  sudah_bayar: {
    label: "Pembayaran dicek admin",
    badgeClass: "badge b-wait",
    dotClass: "bg-[#3b4fd8]",
  },
  sukses: {
    label: "Sukses",
    badgeClass: "badge b-ok",
    dotClass: "bg-[#3b4fd8]",
  },
  dibatalkan: {
    label: "Dibatalkan",
    badgeClass: "badge bg-[#f4f6fd] text-[#6b7394]",
    dotClass: "bg-[#dfe2f5]",
  },
};
