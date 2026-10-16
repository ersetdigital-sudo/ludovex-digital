import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-xl mx-auto px-5 py-24 text-center">
      <div
        className="w-16 h-16 mx-auto rounded-2xl text-white grid place-items-center text-3xl font-extrabold"
        style={{ background: "linear-gradient(135deg,#3b4fd8,#7a5cf2)" }}
      >
        404
      </div>
      <h1 className="text-3xl font-extrabold mt-6">Halaman tidak ditemukan</h1>
      <p className="text-[#6b7394] mt-3">
        Cek lagi tautannya, atau mulai transaksi baru dari beranda.
      </p>
      <div className="mt-7 flex gap-3 justify-center">
        <Link href="/" className="btn btn-ghost">
          Ke Beranda
        </Link>
        <Link href="/bayar" className="btn">
          Mulai Transaksi
        </Link>
      </div>
    </main>
  );
}
