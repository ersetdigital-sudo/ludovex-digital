import type { Metadata } from "next";
import localFont from "next/font/local";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { CS_PHONE_DISPLAY, CS_WA, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/config";
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

const DESCRIPTION =
  "Isi pulsa, beli token listrik, bayar tagihan, dan top up e-wallet dalam hitungan detik. Tanpa daftar, struk langsung terbit.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
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
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DESCRIPTION,
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: DESCRIPTION,
  areaServed: "ID",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: `+${CS_WA}`,
    availableLanguage: "Indonesian",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} antialiased`}>
        <Header />
        {children}
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </body>
    </html>
  );
}
