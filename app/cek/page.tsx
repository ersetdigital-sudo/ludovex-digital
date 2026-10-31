import type { Metadata } from "next";
import { CekTransaksi } from "@/components/cek-transaksi";
import { getPublicBrand, getPublicServices } from "@/lib/db/server";

export const metadata: Metadata = {
  title: "Cek Transaksi",
  description:
    "Cek status transaksi lewat kode referensi atau nomor tujuan, lengkap dengan struk dan SN/token.",
};

export default async function CekPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const [brandResult, servicesResult] = await Promise.all([
    getPublicBrand(),
    getPublicServices(),
  ]);
  const brand = brandResult.data;
  const brandSlug = process.env.BRAND_SLUG?.trim() || brand?.slug || "";

  return (
    <CekTransaksi
      initialQ={sp.q ?? ""}
      brandName={brand?.nama ?? "PPOB"}
      waCs={brand?.wa_cs ?? null}
      brandSlug={brandSlug}
      services={servicesResult.data ?? []}
    />
  );
}
