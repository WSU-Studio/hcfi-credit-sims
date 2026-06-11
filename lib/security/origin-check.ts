/**
 * Cross-origin write guard.
 *
 * Modern browsers send `Origin` on every non-GET fetch and on form POSTs.
 * If a request arrives at our API with an `Origin` that does not match our
 * host (or our explicit allowlist), it cannot have come from our own UI —
 * almost always either a CSRF attempt or someone hitting our API from
 * curl/Postman.
 *
 * Strategy:
 *  - Only guard *unsafe* methods (POST/PUT/PATCH/DELETE). GET/HEAD are
 *    side-effect-free and may legitimately omit `Origin`.
 *  - Allow same-origin (Origin host === request host).
 *  - Allow any host in `ALLOWED_ORIGINS` env (comma-separated full origins).
 *  - If `Origin` is missing, fall back to `Referer` (older clients, some
 *    iframes). If both are missing → reject as 403.
 *
 * NOTE: this is *not* a replacement for CSRF tokens for cookie-auth flows
 * that accept simple form posts (`text/plain` / `multipart`). For our
 * `application/json` endpoints, browsers send a CORS preflight and this
 * check is sufficient.
 */

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function originHost(origin: string | null): string | null {
  if (!origin || origin === 'null') return null;
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

function refererHost(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).host;
  } catch {
    return null;
  }
}

function getAllowedOriginHosts(): Set<string> {
  const raw = process.env.ALLOWED_ORIGINS?.split(',') ?? [];
  const hosts = new Set<string>();
  for (const entry of raw) {
    const host = originHost(entry.trim());
    if (host) hosts.add(host);
  }
  return hosts;
}

export type OriginCheck =
  | { ok: true; reason?: undefined }
  | { ok: false; reason: 'missing-origin' | 'cross-origin' };

/**
 * Returns `{ ok: true }` if the request is allowed to perform a write.
 * Pass the result of `request.method`, `Origin` header, `Referer` header,
 * and the canonical request host (from `request.headers.get('host')`).
 */
export function checkWriteOrigin(opts: {
  method: string;
  origin: string | null;
  referer: string | null;
  host: string | null;
}): OriginCheck {
  if (!UNSAFE_METHODS.has(opts.method.toUpperCase())) {
    return { ok: true };
  }

  const allowed = getAllowedOriginHosts();
  const reqHost = opts.host;

  const incoming = originHost(opts.origin) ?? refererHost(opts.referer);

  if (!incoming) {
    // No Origin AND no Referer on an unsafe method — modern browsers
    // always send at least one, so this is almost certainly a script
    // hitting us from a non-browser context.
    return { ok: false, reason: 'missing-origin' };
  }

  if (reqHost && incoming === reqHost) return { ok: true };
  if (allowed.has(incoming)) return { ok: true };

  return { ok: false, reason: 'cross-origin' };
}
