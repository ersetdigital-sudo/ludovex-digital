import type { Metadata } from "next";
import { HelpCenter } from "@/components/help-center";
import { FAQ } from "@/data/faq";

export const metadata: Metadata = {
  title: "Pusat Bantuan",
  description:
    "Jawaban cepat seputar pembayaran, transaksi, refund, voucher, dan keamanan di Ludovex Digital. Butuh bantuan? Chat CS 24 jam.",
};

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

export default function BantuanPage() {
  return (
    <>
      <HelpCenter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
