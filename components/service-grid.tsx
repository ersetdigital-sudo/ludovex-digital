import Link from "next/link";
import { SERVICES } from "@/data/services";
import { Icon, type IconName } from "./icon";

/** Grid layanan (dipakai di homepage). */
export function ServiceGrid() {
  return (
    <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {SERVICES.map((s) => (
        <Link
          key={s.id}
          href={`/${s.route}`}
          className={`svc t-${s.tone} min-w-0`}
        >
          <Icon
            name={s.id as IconName}
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-[34px] md:h-[34px] shrink-0"
          />
          <span className="text-sm md:text-base text-center break-words">{s.name}</span>
        </Link>
      ))}
    </div>
  );
}
