import Link from "next/link";
import { SERVICES } from "@/data/services";
import { Icon, type IconName } from "./icon";

/** Grid layanan (dipakai di homepage). */
export function ServiceGrid() {
  return (
    <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-4">
      {SERVICES.map((s) => (
        <Link key={s.id} href={`/${s.route}`} className={`svc t-${s.tone}`}>
          <Icon name={s.id as IconName} />
          <span className="text-sm md:text-base text-center">{s.name}</span>
        </Link>
      ))}
    </div>
  );
}
