import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TransactionFlow } from "@/components/transaction-flow";
import { SERVICES, serviceByRoute } from "@/data/services";

/** hanya 8 halaman layanan yang di-build, selain itu 404 */
export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ layanan: s.route }));
}

type Props = {
  params: Promise<{ layanan: string }>;
  searchParams: Promise<{ no?: string; voucher?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { layanan } = await params;
  const svc = serviceByRoute(layanan);
  if (!svc) return {};
  return {
    title: `${svc.bill ? "Bayar" : "Beli"} ${svc.name}`,
    description: `${svc.name} online tanpa ribet. Masukkan ${svc.field.toLowerCase()}, bayar via QRIS atau e-wallet, struk langsung terbit.`,
  };
}

export default async function ServicePage({ params, searchParams }: Props) {
  const { layanan } = await params;
  const svc = serviceByRoute(layanan);
  if (!svc) notFound();

  const sp = await searchParams;

  return (
    <TransactionFlow
      fixedService={svc}
      initialNo={sp.no ?? ""}
      initialVoucher={sp.voucher ?? ""}
    />
  );
}
