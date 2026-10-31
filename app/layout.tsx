import type { Metadata } from "next";
import localFont from "next/font/local";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getPublicBrand } from "@/lib/db/server";
import { SITE_URL } from "@/lib/config";
import { digits } from "@/lib/format";
import "./globals.css";

const jakarta = localFont({
  src: [
    { path: "../public/fonts/plusjakartasans-light.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/plusjakartasans-regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/plusjakartasans-medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/plusjakartasans-semibold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/plusjakartasans-bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/plusjakartasans-extrabold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-jakarta",
  display: "swap",
});

export const revalidate = 60;

const FALLBACK_NAME = "PPOB";
const FALLBACK_TAGLINE = "Layanan pembayaran digital";

/** Isi metadata utama dari brand di database; fallback netral kalau DB bermasalah. */
export async function generateMetadata(): Promise<Metadata> {
  const brandResult = await getPublicBrand();
  const brand = brandResult.data;
  const name = brand?.nama || FALLBACK_NAME;
  const tagline = brand?.tagline || FALLBACK_TAGLINE;
  const description = `${tagline}. Isi pulsa, beli token listrik, bayar tagihan, dan top up e-wallet dalam hitungan detik. Tanpa daftar, struk langsung terbit.`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${name} — ${tagline}`,
      template: `%s — ${name}`,
    },
    description,
    applicationName: name,
    keywords: [
      "PPOB",
      "pulsa",
      "paket data",
      "token PLN",
      "top up e-wallet",
      "bayar tagihan",
      "QRIS",
      "PDAM",
      "BPJS",
    ],
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: SITE_URL,
      siteName: name,
      title: `${name} — ${tagline}`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — ${tagline}`,
      description,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brandResult = await getPublicBrand();
  const brand = brandResult.data;
  const brandName = brand?.nama || FALLBACK_NAME;
  const logoUrl = brand?.logo_url ?? null;
  const waCs = brand?.wa_cs ?? null;
  const waDigits = digits(waCs ?? "");

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brandName,
    url: SITE_URL,
    description: `${brand?.tagline || FALLBACK_TAGLINE}. Layanan pembayaran digital.`,
    areaServed: "ID",
    ...(waDigits
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            telephone: `+${waDigits}`,
            availableLanguage: "Indonesian",
          },
        }
      : {}),
  };

  return (
    <html lang="id">
      <body className={`${jakarta.variable} antialiased`}>
        <Header brandName={brandName} logoUrl={logoUrl} />
        {children}
        <Footer brandName={brandName} logoUrl={logoUrl} waCs={waCs} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </body>
    </html>
  );
}
