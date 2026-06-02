/**
 * Honeypot anti-bot helper.
 *
 * The form renders a hidden input named {@link HONEYPOT_FIELD}. Real users
 * never see/fill it; automated form-stuffers typically fill every input.
 *
 * Server-side: `isHoneypotTripped(body[HONEYPOT_FIELD])` returns true when
 * the trap caught a bot. The endpoint should respond with a *fake success*
 * (HTTP 200) to avoid signalling to the bot that the trap exists, but
 * skip the actual side-effects (DB insert, outbound API call).
 */
export const HONEYPOT_FIELD = 'website_url';

export function isHoneypotTripped(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value !== 'string') return true; // anything non-string is suspicious
  return value.trim().length > 0;
}
