"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label = "Salin",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(value);
      } else {
        const area = document.createElement("textarea");
        area.value = value;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bisa diblokir browser */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={
        className ??
        "bg-white text-[#3b4fd8] text-xs font-bold rounded-lg px-3 py-2 cursor-pointer hover:bg-[#eef0ff] active:scale-95 transition"
      }
    >
      {copied ? "Tersalin ✓" : label}
    </button>
  );
}
