import type { IconName } from "@/components/icon";

export type Tone = "blue" | "purple" | "green" | "peach";

/** [nama, harga jual, id produk database] */
export type ProductItem = [nama: string, harga: number, id?: string];

export type ServiceInputField = {
  key: string;
  label: string;
  placeholder?: string;
  wajib: boolean;
};

export type Service = {
  /** slug database, dipakai untuk route & penyimpanan UI */
  id: string;
  /** UUID service di database, dipakai untuk RPC */
  dbId: string;
  route: string;
  name: string;
  tone: Tone;
  icon: IconName;
  field: string;
  placeholder: string;
  inputFields: ServiceInputField[];
  items?: ProductItem[];
  bill?: boolean;
};

/** Tone warna tetap di kode (bagian desain, bukan data bisnis). */
export const TONES: Tone[] = ["blue", "purple", "green", "peach"];

export const SERVICE_TONES: Record<string, Tone> = {
  pulsa: "blue",
  data: "purple",
  pln: "green",
  pdam: "peach",
  bpjs: "blue",
  internet: "purple",
  ewallet: "green",
  multifinance: "peach",
};

export const SERVICE_ICONS: Record<string, IconName> = {
  pulsa: "pulsa",
  data: "data",
  pln: "pln",
  pdam: "pdam",
  bpjs: "bpjs",
  internet: "inet",
  ewallet: "wallet",
  multifinance: "fin",
};

export const DEFAULT_SERVICE_ICON: IconName = "wallet";

export function toneForService(slug: string, index = 0): Tone {
  return SERVICE_TONES[slug] ?? TONES[index % TONES.length];
}

export function iconForService(slug: string): IconName {
  return SERVICE_ICONS[slug] ?? DEFAULT_SERVICE_ICON;
}

export function findService(services: Service[], value?: string | null): Service | null {
  if (!value) return null;
  const needle = value.toLowerCase();
  return (
    services.find(
      (service) =>
        service.id === value ||
        service.route === value ||
        service.id.toLowerCase() === needle ||
        service.route.toLowerCase() === needle,
    ) ?? null
  );
}

export function findServiceByRoute(
  services: Service[],
  route?: string | null,
): Service | null {
  return findService(services, route);
}

export function routeOf(services: Service[], id: string): string {
  return findService(services, id)?.route ?? "bayar";
}
