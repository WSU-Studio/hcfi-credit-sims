/**
 * Deliberate Cache-Control / content-type policies (SOC finding #6).
 * Classify by sensitivity — do not rely on framework defaults alone.
 */

/** API, auth, admin, dealer — personalized / sensitive. */
export const CACHE_NO_STORE = 'private, no-store, no-cache, must-revalidate';

/**
 * Public metadata (robots.txt, sitemap.xml).
 * Explicit short TTL so crawlers refresh rules without long-lived stale copies.
 */
export const CACHE_PUBLIC_METADATA = 'public, max-age=3600, must-revalidate';

/** Static fingerprinted assets under /_next/static (Next already versions these). */
export const CACHE_STATIC_IMMUTABLE = 'public, max-age=31536000, immutable';

export function isSensitivePath(pathname: string): boolean {
  return (
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dealer') ||
    pathname.startsWith('/auth')
  );
}

export function isPublicMetadataPath(pathname: string): boolean {
  return pathname === '/robots.txt' || pathname === '/sitemap.xml';
}

/** Cache-Control value for a pathname, or null to leave framework default. */
export function cacheControlForPath(pathname: string): string | null {
  if (isSensitivePath(pathname)) return CACHE_NO_STORE;
  if (isPublicMetadataPath(pathname)) return CACHE_PUBLIC_METADATA;
  return null;
}
