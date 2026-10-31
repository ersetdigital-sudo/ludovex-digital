import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { getPublicServices } from "@/lib/db/server";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const services = (await getPublicServices()).data ?? [];

  const staticPages = [
    { path: "", priority: 1 },
    { path: "/bayar", priority: 0.9 },
    { path: "/cek", priority: 0.8 },
    { path: "/bantuan", priority: 0.7 },
    { path: "/tentang", priority: 0.5 },
    { path: "/kebijakan-privasi", priority: 0.3 },
    { path: "/syarat-ketentuan", priority: 0.3 },
  ].map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: p.priority,
  }));

  const servicePages = services.map((service) => ({
    url: `${SITE_URL}/${service.route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...servicePages];
}
