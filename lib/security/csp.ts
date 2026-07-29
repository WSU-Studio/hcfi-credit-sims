/**
 * Content-Security-Policy for the whole app (Edge-safe — no require()).
 *
 * Keep the directive list in sync with `csp-shared.js` (used by next.config.js)
 * so middleware + Next headers() emit the same policy (SOC finding 3a).
 *
 * Set `CSP_ENFORCE=true` (or `1`) to switch from Report-Only → enforce.
 * Middleware re-applies at request time; next.config adds a baseline on all
 * header-eligible responses (including paths that skip the middleware matcher).
 *
 * Note: script-src still allows 'unsafe-inline'/'unsafe-eval' until a nonce
 * migration; tightening those is a separate breaking change.
 */
export const CSP_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com https://www.google.com",
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
