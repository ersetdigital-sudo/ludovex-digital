import type { IconName } from "@/components/icon";
import { rp } from "@/lib/format";
import type { Service, Tone } from "@/data/services";

export type PopularItem = {
  icon: IconName;
  tone: Tone;
  title: string;
  sub: string;
  price: string;
  route: string;
};

/** Nominal termurah dari tiap layanan nominal aktif, maksimal 3 kartu. */
export function buildPopular(services: Service[], limit = 3): PopularItem[] {
  return services
    .filter((service) => !service.bill && service.items && service.items.length > 0)
    .slice(0, limit)
    .map((service) => {
      const cheapest = [...(service.items ?? [])].sort((a, b) => a[1] - b[1])[0];
      return {
        icon: service.icon,
        tone: service.tone,
        title: cheapest[0],
        sub: service.name,
        price: rp(cheapest[1]),
        route: service.route,
      };
    });
}
