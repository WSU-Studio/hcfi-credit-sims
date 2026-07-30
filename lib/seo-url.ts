/**
 * Public site origin helpers for sitemap / Open Graph / Twitter cards.
 * Never emit localhost or relative URLs in production metadata.
 */

const LOCALHOST_HOST_RE = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i;

/** Canonical public site origin from env, or null if unset/invalid. */
export function getPublicSiteOrigin(): string | null {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/$/, '');
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (LOCALHOST_HOST_RE.test(u.hostname) && process.env.NODE_ENV === 'production') {
      return null;
    }
    return u.origin;
  } catch {
    return null;
  }
}

/**
 * Turn a relative path, same-origin absolute URL, or media URL into an
 * absolute https/http URL for og:image / twitter:image.
 * - Strips accidental localhost origins when a public site origin exists.
 * - Returns null if we cannot form a safe absolute public URL.
 */
export function toAbsolutePublicUrl(
  maybeUrl: string | null | undefined,
  fallbackPath = '/images/main-banner.jpg'
): string | null {
  const origin = getPublicSiteOrigin();
  const raw = (maybeUrl ?? '').trim() || fallbackPath;

  if (raw.startsWith('/')) {
    return origin ? `${origin}${raw}` : null;
  }

  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

    // Rewrite accidental localhost absolute URLs to the public origin + path.
    if (LOCALHOST_HOST_RE.test(u.hostname)) {
      if (!origin) return null;
      return `${origin}${u.pathname}${u.search}`;
    }

    return u.toString();
  } catch {
    // Not a valid absolute URL — treat as site-relative path.
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return origin ? `${origin}${path}` : null;
  }
}

/** Convenience for Metadata openGraph/twitter images arrays. */
export function ogImageEntry(
  maybeUrl: string | null | undefined,
  alt: string,
  fallbackPath = '/images/main-banner.jpg'
): { url: string; width: number; height: number; alt: string } | undefined {
  const url = toAbsolutePublicUrl(maybeUrl, fallbackPath);
  if (!url) return undefined;
  return { url, width: 1200, height: 630, alt };
}
