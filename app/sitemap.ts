import type { MetadataRoute } from "next";
import { SERVICES } from "@/data/services";
import { SITE_URL } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

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

  const servicePages = SERVICES.map((s) => ({
    url: `${SITE_URL}/${s.route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...servicePages];
}
