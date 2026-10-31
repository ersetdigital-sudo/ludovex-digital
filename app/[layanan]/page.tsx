import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TransactionFlow } from "@/components/transaction-flow";
import { DataUnavailable } from "@/components/data-unavailable";
import { findServiceByRoute } from "@/data/services";
import {
  getPublicBrand,
  getPublicPaymentMethods,
  getPublicServices,
} from "@/lib/db/server";

type Props = {
  params: Promise<{ layanan: string }>;
  searchParams: Promise<{ no?: string; voucher?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { layanan } = await params;
  const [servicesResult, brandResult] = await Promise.all([
    getPublicServices(),
    getPublicBrand(),
  ]);
  const svc = servicesResult.data
    ? findServiceByRoute(servicesResult.data, layanan)
    : null;
  if (!svc) return {};

  return {
    title: `${svc.bill ? "Bayar" : "Beli"} ${svc.name}`,
    description: `${svc.name} online tanpa ribet. Masukkan ${svc.field.toLowerCase()}, bayar via QRIS atau e-wallet, struk langsung terbit.${
      brandResult.data ? ` ${brandResult.data.nama}.` : ""
    }`,
  };
}

export default async function ServicePage({ params, searchParams }: Props) {
  const { layanan } = await params;
  const sp = await searchParams;

  const [servicesResult, methodsResult, brandResult] = await Promise.all([
    getPublicServices(),
    getPublicPaymentMethods(),
    getPublicBrand(),
  ]);

  if (!servicesResult.data || !methodsResult.data || !brandResult.data) {
    return (
      <main className="max-w-6xl mx-auto px-5 py-8 md:py-12">
        <DataUnavailable />
      </main>
    );
  }

  const svc = findServiceByRoute(servicesResult.data, layanan);
  if (!svc) notFound();

  return (
    <TransactionFlow
      services={servicesResult.data}
      paymentMethods={methodsResult.data}
      brand={brandResult.data}
      fixedService={svc}
      initialNo={sp.no ?? ""}
      initialVoucher={sp.voucher ?? ""}
    />
  );
}
