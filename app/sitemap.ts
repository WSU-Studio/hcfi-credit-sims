import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getPublicSiteOrigin } from "@/lib/seo-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getPublicSiteOrigin();
  // Without a public origin, emit nothing — never fall back to localhost.
  if (!siteUrl) return [];

  const baseEntries = routing.locales.flatMap((locale) => {
    const prefix = `/${locale}`;
    return [
      {
        url: `${siteUrl}${prefix}`,
        changeFrequency: "daily" as const,
        priority: 1,
      },
      {
        url: `${siteUrl}${prefix}/credit-simulation`,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      },
      {
        url: `${siteUrl}${prefix}/promo`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
      {
        url: `${siteUrl}${prefix}/informasi`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
    ];
  });

  return baseEntries;
}
