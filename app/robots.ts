import type { MetadataRoute } from "next";

/**
 * Public crawler rules. Cache-Control / Content-Type are set in next.config.js
 * (public, max-age=3600) so metadata is explicit for security scanners.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/dealer/", "/auth/", "/id/admin/", "/en/admin/"],
    },
    sitemap: siteUrl ? `${siteUrl}/sitemap.xml` : undefined,
    host: siteUrl,
  };
}
