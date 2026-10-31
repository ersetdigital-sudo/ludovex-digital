import type { Metadata } from "next";
import Link from "next/link";
import { TransactionFlow } from "@/components/transaction-flow";
import { PaymentDetail } from "@/components/payment-detail";
import { DataUnavailable } from "@/components/data-unavailable";
import { findService } from "@/data/services";
import {
  getOrderByRef,
  getPaymentByRef,
  getPublicBrand,
  getPublicPaymentMethods,
  getPublicServices,
} from "@/lib/db/server";

export const metadata: Metadata = {
  title: "Bayar",
  description:
    "Pilih layanan, masukkan nomor, bayar pakai QRIS, e-wallet, atau virtual account. Selesai dalam hitungan detik.",
};

type Props = {
  searchParams: Promise<{
    ref?: string;
    layanan?: string;
    no?: string;
    voucher?: string;
  }>;
};

export default async function BayarPage({ searchParams }: Props) {
  const sp = await searchParams;
  const ref = typeof sp.ref === "string" ? sp.ref.trim() : "";

  if (ref) {
    const paymentResult = await getPaymentByRef(ref);

    if (!paymentResult.data) {
      return (
        <main className="max-w-xl mx-auto px-5 py-16 md:py-24 text-center">
          <div className="card p-8">
            <h1 className="text-2xl font-extrabold">Pembayaran</h1>
            <p className="text-sm text-[#6b7394] mt-2">{paymentResult.error}</p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href={`/cek?q=${encodeURIComponent(ref)}`}
                className="btn btn-ghost"
              >
                Cek Transaksi
              </Link>
              <Link href="/bayar" className="btn">
                Transaksi Baru
              </Link>
            </div>
          </div>
        </main>
      );
    }

    const payment = paymentResult.data;
    let sn: string | null = null;
    if (payment.status === "sukses") {
      const orderResult = await getOrderByRef(payment.ref);
      sn = orderResult.data?.find((order) => order.ref === payment.ref)?.sn ?? null;
    }

    return (
      <main className="max-w-6xl mx-auto px-5 py-8 md:py-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Pembayaran</h1>
          <p className="text-sm text-[#6b7394] mt-1">
            Detail transaksi <b className="font-mono">{payment.ref}</b>
          </p>
        </div>
        <section className="mt-6">
          <PaymentDetail payment={payment} sn={sn} />
        </section>
      </main>
    );
  }

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

  return (
    <TransactionFlow
      services={servicesResult.data}
      paymentMethods={methodsResult.data}
      brand={brandResult.data}
      fixedService={findService(servicesResult.data, sp.layanan)}
      initialNo={sp.no ?? ""}
      initialVoucher={sp.voucher ?? ""}
    />
  );
}
