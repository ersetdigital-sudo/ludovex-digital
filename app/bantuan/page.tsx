import type { Metadata } from "next";
import { HelpCenter } from "@/components/help-center";
import { FAQ } from "@/data/faq";
import { getPublicBrand } from "@/lib/db/server";

export async function generateMetadata(): Promise<Metadata> {
  const brand = (await getPublicBrand()).data;
  return {
    title: "Pusat Bantuan",
    description: `Jawaban cepat seputar pembayaran, transaksi, refund, voucher, dan keamanan${
      brand ? ` di ${brand.nama}` : ""
    }. Butuh bantuan? Chat CS.`,
  };
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.flatMap(([, , entries]) =>
    entries.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  ),
};

export default async function BantuanPage() {
  const brand = (await getPublicBrand()).data;

  return (
    <>
      <HelpCenter
        brandName={brand?.nama ?? "PPOB"}
        waCs={brand?.wa_cs ?? null}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
