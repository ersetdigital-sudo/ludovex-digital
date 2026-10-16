import type { Metadata } from "next";
import { CekTransaksi } from "@/components/cek-transaksi";

export const metadata: Metadata = {
  title: "Cek Transaksi",
  description:
    "Cek status transaksi Ludovex Digital lewat kode referensi (REF-LDX…) atau nomor tujuan, lengkap dengan struknya.",
};

export default async function CekPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  return <CekTransaksi initialQ={sp.q ?? ""} />;
}
