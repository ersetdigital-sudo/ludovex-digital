"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./icon";
import { Logo } from "./logo";

const LINKS = [
  { href: "/#layanan", label: "Layanan" },
  { href: "/#alur", label: "Cara Bayar" },
  { href: "/cek", label: "Cek Transaksi" },
  { href: "/bantuan", label: "Bantuan" },
  { href: "/tentang", label: "Tentang" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // tutup menu tiap pindah halaman
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="bg-white/85 backdrop-blur-md sticky top-0 z-30 border-b border-[#eceefa]">
      <nav className="max-w-6xl mx-auto px-5 h-[68px] flex items-center justify-between gap-4">
        <Link href="/" aria-label="Ludovex Digital">
          <Logo />
        </Link>

        <div className="hidden md:flex gap-8 text-sm font-semibold text-[#6b7394]">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[#16204a]">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/cek"
            className="md:hidden w-10 h-10 grid place-items-center rounded-full border border-[#e1e4f5] text-[#3b4fd8]"
            aria-label="Cek transaksi"
          >
            <Icon name="search" className="w-5 h-5" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden w-10 h-10 grid place-items-center rounded-full border border-[#e1e4f5] text-[#3b4fd8]"
            aria-label="Buka menu"
            aria-expanded={open}
          >
            <span className="block w-4 space-y-1">
              <span className={`block h-0.5 bg-current rounded ${open ? "translate-y-1.5 rotate-45" : ""}`} />
              <span className={`block h-0.5 bg-current rounded ${open ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 bg-current rounded ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
            </span>
          </button>
          <Link href="/bayar" className="btn !py-2.5 !px-5 text-sm whitespace-nowrap">
            Bayar<span className="hidden sm:inline">&nbsp;Sekarang</span>
          </Link>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-[#eceefa] bg-white px-5 py-3 grid gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#6b7394] hover:bg-[#f4f6fd] hover:text-[#16204a]"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
