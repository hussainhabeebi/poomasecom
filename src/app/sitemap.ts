import type { MetadataRoute } from "next";
import { activeProducts, categories } from "@/lib/store";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily" },
    ...categories.map((c) => ({ url: `${base}/shop?category=${c.slug}`, changeFrequency: "weekly" as const })),
    ...activeProducts().map((p) => ({ url: `${base}/product/${p.slug}`, changeFrequency: "weekly" as const })),
    ...["wholesale", "seller", "reseller", "affiliate", "help"].map((p) => ({ url: `${base}/${p}`, changeFrequency: "monthly" as const })),
  ];
}
