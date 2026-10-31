import Link from "next/link";
import type { Service } from "@/data/services";
import { Icon } from "./icon";

/** Grid layanan (dipakai di homepage). */
export function ServiceGrid({ services }: { services: Service[] }) {
  if (services.length === 0) return null;

  return (
    <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {services.map((s) => (
        <Link
          key={s.id}
          href={`/${s.route}`}
          className={`svc t-${s.tone} min-w-0`}
        >
          <Icon
            name={s.icon}
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-[34px] md:h-[34px] shrink-0"
          />
          <span className="text-sm md:text-base text-center break-words">{s.name}</span>
        </Link>
      ))}
    </div>
  );
}
