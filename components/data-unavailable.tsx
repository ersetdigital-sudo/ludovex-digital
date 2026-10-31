import Link from "next/link";
import { Icon } from "./icon";

export function DataUnavailable({
  message = "Layanan lagi gangguan, coba lagi sebentar.",
}: {
  message?: string;
}) {
  return (
    <div className="card p-8 text-center max-w-xl mx-auto">
      <div className="w-14 h-14 mx-auto rounded-2xl t-peach p-3.5">
        <Icon name="clock" />
      </div>
      <div className="font-bold mt-3">Layanan lagi gangguan</div>
      <p className="text-sm text-[#6b7394] mt-1">{message}</p>
      <Link href="/" className="btn btn-ghost mt-5">
        Kembali ke beranda
      </Link>
    </div>
  );
}
