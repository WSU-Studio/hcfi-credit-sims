/**
 * Low-level input sanitization primitives shared across API routes.
 *
 * Goal: defense-in-depth. React auto-escapes JSX text and Prisma uses
 * parameterized queries — so neither SQLi nor reflected XSS can execute via
 * normal flows. These helpers keep the *stored* data clean so it cannot
 * surface as a problem in downstream consumers (CSV/Excel export,
 * outbound email templates, third-party APIs that re-render HTML, etc.).
 */

/** Strip ASCII control characters (except tab/newline) and zero-width chars. */
export function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028\u2029\uFEFF]/g, '');
}

/**
 * Returns true if `value` looks like a script/HTML injection probe.
 * Used to reject the most obvious payloads at the API boundary, e.g.
 * `<script>`, `<img onerror=...>`, `javascript:`, etc.
 *
 * This is *not* an XSS escape (React already does that on render); it just
 * prevents a polluted leads table and trims log noise from scanners.
 */
const SUSPICIOUS_PATTERNS = [
  /<\s*script\b/i,
  /<\s*\/\s*script\b/i,
  /<\s*img\b[^>]*\bon\w+\s*=/i,
  /<\s*iframe\b/i,
  /<\s*svg\b[^>]*\bon\w+\s*=/i,
  /\bon(?:error|load|click|mouseover|focus)\s*=/i,
  /javascript\s*:/i,
  /data\s*:\s*text\/html/i,
];

export function looksMalicious(value: string): boolean {
  if (!value) return false;
  return SUSPICIOUS_PATTERNS.some((re) => re.test(value));
}

/**
 * Normalize a free-form text field: trim, strip control chars, collapse
 * runs of whitespace. Caller decides max length via zod `.max()`.
 */
export function cleanString(value: string): string {
  return stripControlChars(value).replace(/\s+/g, ' ').trim();
}
