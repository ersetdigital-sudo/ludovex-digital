import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Ludovex Digital — Semua pembayaran digital, satu tempat";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#3b4fd8 0%,#6d5cf0 60%,#8f6cf7 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
          padding: 80,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 40 40">
            <rect width="40" height="40" rx="12" fill="#ffffff" fillOpacity="0.15" />
            <path
              d="M13 10v17h15"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="27.5" cy="13.5" r="3.6" fill="#7ff0c6" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>LUDOVEX</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 14, opacity: 0.85 }}>
              DIGITAL
            </div>
          </div>
        </div>

        <div style={{ fontSize: 56, fontWeight: 800, marginTop: 56, lineHeight: 1.15 }}>
          Semua pembayaran digital.
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#9fd0ff" }}>Satu tempat.</div>

        <div style={{ fontSize: 28, marginTop: 40, opacity: 0.85 }}>
          Pulsa · Token PLN · Paket Data · Tagihan · E-Wallet
        </div>
      </div>
    ),
    size,
  );
}
