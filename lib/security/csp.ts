/**
 * Content-Security-Policy for the whole app.
 *
 * Set `CSP_ENFORCE=true` (or `1`) to switch from Report-Only → enforce.
 * Evaluated at request time in middleware so EB env can flip without rebuild.
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
