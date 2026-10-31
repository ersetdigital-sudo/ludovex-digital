import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  iconForService,
  toneForService,
  type ProductItem,
  type Service,
  type ServiceInputField,
} from "@/data/services";
import type { PayMethod } from "@/data/payments";
import {
  SERVICE_UNAVAILABLE_MESSAGE,
  mapRpcError,
  toPublicError,
} from "./errors";
import { mapOrderLookupList, mapPaymentInfo } from "./mappers";
import type { DbResult, OrderLookup, PaymentInfo, WebBrand } from "./types";

const CACHE_SECONDS = 60;
const BRAND_COLUMNS =
  "id,nama,slug,domain,tagline,logo_url,warna_utama,wa_cs,qris_image_url,batas_bayar_menit,jam_cek_tagihan";

type Env = {
  url: string;
  anonKey: string;
  brandSlug: string;
};

type ServiceRow = {
  id: string;
  nama: string;
  slug: string;
  jenis: string;
  input_fields: unknown;
  urutan: number;
  aktif: boolean;
};

type ProductRow = {
  id: string;
  service_id: string;
  nama: string;
  harga_jual: number | string;
  urutan: number;
};

type PaymentMethodRow = {
  id: string;
  nama: string;
  tipe: string;
  biaya_admin: number | string;
  urutan: number;
};

function readEnv(): Env | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const brandSlug = process.env.BRAND_SLUG?.trim();
  if (!url || !anonKey || !brandSlug) return null;
  return { url, anonKey, brandSlug };
}

const cachedFetch = ((input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, {
    ...init,
    next: { revalidate: CACHE_SECONDS },
  } as RequestInit)) as typeof fetch;

const liveFetch = ((input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, { ...init, cache: "no-store" })) as typeof fetch;

let cachedClient: SupabaseClient | null = null;
let liveClient: SupabaseClient | null = null;

function getClient(live = false): SupabaseClient | null {
  const env = readEnv();
  if (!env) return null;

  if (live) {
    if (!liveClient) {
      liveClient = createClient(env.url, env.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: liveFetch },
      });
    }
    return liveClient;
  }

  if (!cachedClient) {
    cachedClient = createClient(env.url, env.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: cachedFetch },
    });
  }
  return cachedClient;
}

function parseInputFields(value: unknown): ServiceInputField[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const field = item as Record<string, unknown>;
    const key = typeof field.key === "string" ? field.key.trim() : "";
    const label = typeof field.label === "string" ? field.label.trim() : "";
    if (!key || !label) return [];
    return [
      {
        key,
        label,
        placeholder:
          typeof field.placeholder === "string" ? field.placeholder : "",
        wajib: field.wajib === true,
      },
    ];
  });
}

export async function getPublicBrand(): Promise<DbResult<WebBrand>> {
  const env = readEnv();
  const client = getClient();
  if (!env || !client) {
    return { data: null, error: SERVICE_UNAVAILABLE_MESSAGE };
  }

  try {
    const { data, error } = await client
      .from("brands")
      .select(BRAND_COLUMNS)
      .eq("slug", env.brandSlug)
      .maybeSingle();

    if (error || !data) {
      return { data: null, error: SERVICE_UNAVAILABLE_MESSAGE };
    }

    const row = data as Record<string, unknown>;
    return {
      data: {
        id: String(row.id),
        nama: String(row.nama),
        slug: String(row.slug),
        domain: String(row.domain),
        tagline: typeof row.tagline === "string" ? row.tagline : null,
        logo_url: typeof row.logo_url === "string" ? row.logo_url : null,
        warna_utama: typeof row.warna_utama === "string" ? row.warna_utama : null,
        wa_cs: typeof row.wa_cs === "string" ? row.wa_cs : null,
        qris_image_url:
          typeof row.qris_image_url === "string" ? row.qris_image_url : null,
        batas_bayar_menit: Number(row.batas_bayar_menit) || 15,
        jam_cek_tagihan:
          typeof row.jam_cek_tagihan === "string" ? row.jam_cek_tagihan : null,
      },
      error: null,
    };
  } catch {
    return { data: null, error: SERVICE_UNAVAILABLE_MESSAGE };
  }
}

export async function getPublicServices(): Promise<DbResult<Service[]>> {
  const brandResult = await getPublicBrand();
  const brand = brandResult.data;
  if (!brand) {
    return { data: null, error: brandResult.error ?? SERVICE_UNAVAILABLE_MESSAGE };
  }

  const client = getClient();
  if (!client) {
    return { data: null, error: SERVICE_UNAVAILABLE_MESSAGE };
  }

  try {
    const [servicesResult, productsResult] = await Promise.all([
      client
        .from("services")
        .select("id,nama,slug,jenis,input_fields,urutan,aktif")
        .eq("brand_id", brand.id)
        .eq("aktif", true)
        .order("urutan", { ascending: true })
        .order("nama", { ascending: true }),
      client
        .from("products")
        .select("id,service_id,nama,harga_jual,urutan")
        .eq("brand_id", brand.id)
        .eq("aktif", true)
        .order("urutan", { ascending: true })
        .order("nama", { ascending: true }),
    ]);

    if (servicesResult.error || productsResult.error) {
      return { data: null, error: SERVICE_UNAVAILABLE_MESSAGE };
    }

    const productsByService = new Map<string, ProductItem[]>();
    ((productsResult.data ?? []) as ProductRow[]).forEach((product) => {
      const list = productsByService.get(product.service_id) ?? [];
      list.push([product.nama, Number(product.harga_jual), product.id]);
      productsByService.set(product.service_id, list);
    });

    const services = ((servicesResult.data ?? []) as ServiceRow[]).map(
      (service, index) => {
        const inputFields = parseInputFields(service.input_fields);
        const items = productsByService.get(service.id) ?? [];
        const firstField = inputFields[0];
        return {
          id: service.slug,
          dbId: service.id,
          route: service.slug,
          name: service.nama,
          tone: toneForService(service.slug, index),
          icon: iconForService(service.slug),
          field: firstField?.label ?? "Nomor tujuan",
          placeholder: firstField?.placeholder ?? "",
          inputFields,
          items: items.length > 0 ? items : undefined,
          bill: service.jenis === "tagihan",
        } satisfies Service;
      },
    );

    return { data: services, error: null };
  } catch {
    return { data: null, error: SERVICE_UNAVAILABLE_MESSAGE };
  }
}

export async function getPublicPaymentMethods(): Promise<DbResult<PayMethod[]>> {
  const brandResult = await getPublicBrand();
  const brand = brandResult.data;
  if (!brand) {
    return { data: null, error: brandResult.error ?? SERVICE_UNAVAILABLE_MESSAGE };
  }

  const client = getClient();
  if (!client) {
    return { data: null, error: SERVICE_UNAVAILABLE_MESSAGE };
  }

  try {
    const { data, error } = await client
      .from("payment_methods")
      .select("id,nama,tipe,biaya_admin,urutan")
      .eq("brand_id", brand.id)
      .eq("aktif", true)
      .order("urutan", { ascending: true });

    if (error) {
      return { data: null, error: SERVICE_UNAVAILABLE_MESSAGE };
    }

    const methods = ((data ?? []) as PaymentMethodRow[]).flatMap((method) => {
      const type =
        method.tipe === "qr"
          ? "qr"
          : method.tipe === "ewallet"
            ? "ew"
            : method.tipe === "va"
              ? "va"
              : null;
      if (!type) return [];
      return [
        {
          id: method.id,
          name: method.nama,
          fee: Number(method.biaya_admin) || 0,
          type,
        } satisfies PayMethod,
      ];
    });

    return { data: methods, error: null };
  } catch {
    return { data: null, error: SERVICE_UNAVAILABLE_MESSAGE };
  }
}

export async function getOrderByRef(
  refInput: string,
): Promise<DbResult<OrderLookup[]>> {
  const ref = refInput.trim();
  const env = readEnv();
  const client = getClient(true);
  if (!ref || !env || !client) {
    return { data: null, error: SERVICE_UNAVAILABLE_MESSAGE };
  }

  try {
    const { data, error } = await client.rpc("cek_order", {
      p_brand_slug: env.brandSlug,
      p_ref: ref,
      p_nomor_tujuan: null,
    });
    if (error) {
      return { data: null, error: mapRpcError(error).message };
    }
    return { data: mapOrderLookupList(data), error: null };
  } catch (error) {
    return { data: null, error: toPublicError(error).message };
  }
}

/** Pembayaran by ref tidak di-cache: link /bayar harus selalu status terbaru. */
export async function getPaymentByRef(
  refInput: string,
): Promise<DbResult<PaymentInfo>> {
  const ref = refInput.trim();
  if (!ref) {
    return { data: null, error: "Kode referensi tidak ditemukan." };
  }

  const client = getClient(true);
  if (!client) {
    return { data: null, error: SERVICE_UNAVAILABLE_MESSAGE };
  }

  try {
    const { data, error } = await client.rpc("get_payment", { p_ref: ref });
    if (error) {
      return { data: null, error: mapRpcError(error).message };
    }
    if (!data) {
      return { data: null, error: SERVICE_UNAVAILABLE_MESSAGE };
    }
    return { data: mapPaymentInfo(data), error: null };
  } catch (error) {
    return { data: null, error: toPublicError(error).message };
  }
}
