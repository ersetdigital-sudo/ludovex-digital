import type { Metadata } from "next";
import { TransactionFlow } from "@/components/transaction-flow";
import { resolveService } from "@/data/services";

export const metadata: Metadata = {
  title: "Bayar",
  description:
    "Pilih layanan, masukkan nomor, bayar pakai QRIS, e-wallet, atau virtual account. Selesai dalam hitungan detik.",
};

type Props = {
  searchParams: Promise<{ layanan?: string; no?: string; voucher?: string }>;
};

export default async function BayarPage({ searchParams }: Props) {
  const sp = await searchParams;

  return (
    <TransactionFlow
      fixedService={resolveService(sp.layanan)}
      initialNo={sp.no ?? ""}
      initialVoucher={sp.voucher ?? ""}
    />
  );
}
