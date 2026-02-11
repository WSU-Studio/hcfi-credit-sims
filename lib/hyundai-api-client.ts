/**
 * Shared config and headers for outbound requests to Hyundai Credit Simulation API.
 * Token from Login (v3/Auth/Login) is sent in header "AdInsKey" (same as Postman API Key).
 * Supports CREDIT_SIMULATION_TOKEN (static) or Login with username/password.
 */

export const CREDIT_SIMULATION_API_BASE_URL =
  process.env.CREDIT_SIMULATION_API_URL ||
  'https://qaapigwconfins.hyundaicapital.co.id/api/mobileloan';

const LOGIN_PATH = '/v3/Auth/Login';

/** In-memory cache: { token, expiresAtMs } */
let tokenCache: { token: string; expiresAtMs: number } | null = null;
const DEFAULT_TTL_MS = 55 * 60 * 1000; // 55 min if API doesn't return expiry
const TTL_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

/**
 * Parse token lifetime in seconds from Login response.
 * Common keys: ExpiresIn, TokenExpiresIn, expires_in, ExpirySeconds.
 */
function parseExpiresInSeconds(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const candidates = [
    o.ExpiresIn,
    o.TokenExpiresIn,
    o.expires_in,
    o.ExpirySeconds,
  ];
  for (const v of candidates) {
    if (typeof v === 'number' && v > 0) return v;
    if (typeof v === 'string' && /^\d+$/.test(v)) return parseInt(v, 10);
  }
  if (o.ReturnObject && typeof o.ReturnObject === 'object') {
    const r = o.ReturnObject as Record<string, unknown>;
    const rCandidates = [r.ExpiresIn, r.TokenExpiresIn, r.ExpirySeconds];
    for (const v of rCandidates) {
      if (typeof v === 'number' && v > 0) return v;
      if (typeof v === 'string' && /^\d+$/.test(v)) return parseInt(v, 10);
    }
  }
  return null;
}

function parseTokenFromLoginResponse(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  // Hyundai response uses "Token" (capital T) at root
  if (typeof o.Token === 'string') return o.Token;
  if (typeof o.token === 'string') return o.token;
  if (typeof o.accessToken === 'string') return o.accessToken;
  if (o.data && typeof o.data === 'object') {
    const d = o.data as Record<string, unknown>;
    if (typeof d.token === 'string') return d.token;
    if (typeof d.accessToken === 'string') return d.accessToken;
  }
  if (o.ReturnObject && typeof o.ReturnObject === 'object') {
    const r = o.ReturnObject as Record<string, unknown>;
    if (typeof r.Token === 'string') return r.Token;
    if (typeof r.AccessToken === 'string') return r.AccessToken;
    if (typeof r.token === 'string') return r.token;
  }
  return null;
}

/**
 * Call Hyundai Login API and return token. Result is cached until near expiry.
 * Set CREDIT_SIMULATION_USERNAME and CREDIT_SIMULATION_PASSWORD in .env.
 */
export async function getHyundaiToken(): Promise<string | null> {
  const username = process.env.CREDIT_SIMULATION_USERNAME;
  const password = process.env.CREDIT_SIMULATION_PASSWORD;
  if (!username || !password) return null;

  const now = Date.now();
  if (tokenCache && tokenCache.expiresAtMs > now) {
    return tokenCache.token;
  }

  const doLogin = async (): Promise<string | null> => {
    const url = `${CREDIT_SIMULATION_API_BASE_URL}${LOGIN_PATH}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          process.env.CREDIT_SIMULATION_USER_AGENT ||
          'HyundaiCapital-Website/1.0',
      },
      body: JSON.stringify({
        username,
        password,
        IsRememberMe: true,
      }),
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      console.error('Hyundai Login: response bukan JSON (mis. gateway error):', text?.slice(0, 200));
      return null;
    }
    const token = parseTokenFromLoginResponse(data);
    if (!token) {
      console.error(
        'Hyundai Login: no token in response. Keys:',
        data ? Object.keys(data as object) : 'null'
      );
      return null;
    }
    const expiresInSeconds = parseExpiresInSeconds(data);
    const ttlMs =
      expiresInSeconds != null
        ? Math.max(0, expiresInSeconds * 1000 - TTL_BUFFER_MS)
        : DEFAULT_TTL_MS;
    tokenCache = {
      token,
      expiresAtMs: now + ttlMs,
    };
    if (process.env.NODE_ENV === 'development' && expiresInSeconds != null) {
      console.log(
        `[Hyundai API] Token dari Login, masa berlaku dari API: ${expiresInSeconds} detik (~${Math.round(expiresInSeconds / 60)} menit)`
      );
    } else if (process.env.NODE_ENV === 'development') {
      console.log(
        '[Hyundai API] Token dari Login, response tidak berisi ExpiresIn; pakai default ~55 menit.'
      );
    }
    return token;
  };

  try {
    let token = await doLogin();
    if (!token) {
      await new Promise((r) => setTimeout(r, 1500));
      token = await doLogin();
    }
    return token;
  } catch (err) {
    console.error('Hyundai Login failed:', err);
    return null;
  }
}

/**
 * Clear cached token (e.g. after 401 so next request will re-login).
 */
export function clearHyundaiTokenCache(): void {
  tokenCache = null;
}

/**
 * Returns headers for outbound requests to Hyundai API.
 * Token is sent as header "AdInsKey" (same as Postman).
 * Priority: jika USERNAME + PASSWORD di-set → selalu Login, token di-update otomatis sebelum kadaluarsa.
 *           jika hanya CREDIT_SIMULATION_TOKEN di-set → pakai token statis (bisa expired).
 */
export async function getHyundaiRequestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent':
      process.env.CREDIT_SIMULATION_USER_AGENT ||
      'HyundaiCapital-Website/1.0',
  };

  const username = process.env.CREDIT_SIMULATION_USERNAME;
  const password = process.env.CREDIT_SIMULATION_PASSWORD;

  // Prefer auto-Login: token selalu di-update dari API, tidak pakai token statis yang bisa expired
  if (username && password) {
    const token = await getHyundaiToken();
    if (token) {
      headers['AdInsKey'] = token;
    }
    const apiKey = process.env.CREDIT_SIMULATION_API_KEY;
    if (apiKey) headers['X-API-Key'] = apiKey;
    return headers;
  }

  // Fallback: token statis dari .env (bisa kadaluarsa)
  const staticToken = process.env.CREDIT_SIMULATION_TOKEN;
  if (staticToken?.trim()) {
    headers['AdInsKey'] = staticToken.trim();
  }

  const apiKey = process.env.CREDIT_SIMULATION_API_KEY;
  if (apiKey) headers['X-API-Key'] = apiKey;

  return headers;
}
