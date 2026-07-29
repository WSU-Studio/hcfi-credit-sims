/**
 * Content-Security-Policy for the whole app (Edge-safe — no require()).
 *
 * Keep the directive list in sync with `csp-shared.js` (used by next.config.js).
 *
 * Aligned with Google Tag Manager / GA4 CSP guidance (minimum viable, no nonce yet):
 * https://developers.google.com/tag-platform/security/guides/csp
 *
 * Set `CSP_ENFORCE=true` (or `1`) to switch from Report-Only → enforce.
 *
 * Still pending (Ideal CSP): per-request nonce to drop script-src 'unsafe-inline'.
 * style-src 'unsafe-inline' kept for Next.js / inline styles.
 * GTM Custom JavaScript variables need 'unsafe-eval' — removed per SOC; prefer
 * Custom Templates in GTM if tags break.
 */
export const CSP_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  // No 'unsafe-eval'; no broad www.google.com. Keep 'unsafe-inline' until nonce migration.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com",
  "style-src 'self' 'unsafe-inline'",
  // No https: wildcard — explicit GA/GTM + known media hosts used by CMS/banner/S3.
  "img-src 'self' data: blob: https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.g.doubleclick.net https://*.amazonaws.com https://*.pexels.com https://*.unsplash.com https://*.cloudinary.com",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com https://analytics.google.com https://*.analytics.google.com",
  "frame-src 'self' https://www.googletagmanager.com",
  "worker-src 'self' blob:",
].join('; ');

export function isCspEnforceEnabled(): boolean {
  const raw = (process.env.CSP_ENFORCE ?? '').trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

/** Header name: enforce vs observe-only. */
export function getCspHeaderName(): string {
  return isCspEnforceEnabled()
    ? 'Content-Security-Policy'
    : 'Content-Security-Policy-Report-Only';
}
