/**
 * Hyundai Credit Simulation API client.
 * - Login (POST /v3/Auth/Login) to obtain token.
 * - Use token in header AdInsKey for all data API calls.
 */

const QA_API_BASE_URL =
  'https://qaapigwconfins.hyundaicapital.co.id/api/mobileloan';
const QA_FOU_API_BASE_URL =
  'https://qaapigwconfins.hyundaicapital.co.id/api/fou';

function resolveApiBaseUrl(): string {
  const fromEnv = process.env.API_BASE_URL?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'API_BASE_URL must be set in production (refusing QA fallback)'
    );
  }
  return QA_API_BASE_URL;
}

function resolveFouApiBaseUrl(): string {
  const fou = process.env.HYUNDAI_FOU_API_URL?.trim();
  if (fou) return fou;
  const mobile = process.env.API_BASE_URL?.trim();
  if (mobile) {
    return mobile.replace(/\/api\/mobileloan\/?$/, '/api/fou');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'API_BASE_URL or HYUNDAI_FOU_API_URL must be set in production (refusing QA fallback)'
    );
  }
  return QA_FOU_API_BASE_URL;
}

/**
 * Resolved at call time so missing env fails on first API use (not at import).
 * Prefer `getApiBaseUrl()` / `getFouApiBaseUrl()`; these getters keep existing
 * `${API_BASE_URL}/...` call sites working via toString.
 */
export const API_BASE_URL = {
  toString() {
    return resolveApiBaseUrl();
  },
  valueOf() {
    return resolveApiBaseUrl();
  },
  [Symbol.toPrimitive]() {
    return resolveApiBaseUrl();
  },
} as unknown as string;

export const FOU_API_BASE_URL = {
  toString() {
    return resolveFouApiBaseUrl();
  },
  valueOf() {
    return resolveFouApiBaseUrl();
  },
  [Symbol.toPrimitive]() {
    return resolveFouApiBaseUrl();
  },
} as unknown as string;

export function getApiBaseUrl(): string {
  return resolveApiBaseUrl();
}

export function getFouApiBaseUrl(): string {
  return resolveFouApiBaseUrl();
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
/** Shared in-flight login so concurrent API routes do not race multiple Auth/Login calls. */
let loginInFlight: Promise<string | null> | null = null;
const TOKEN_TTL_MS = 50 * 60 * 1000; // 50 minutes

interface LoginResponse {
  Token?: string;
  [key: string]: unknown;
}

async function login(): Promise<string | null> {
  const username = process.env.CREDIT_SIMULATION_USERNAME;
  const password = process.env.CREDIT_SIMULATION_PASSWORD;
  if (!username || !password) {
    console.warn('Hyundai API: CREDIT_SIMULATION_USERNAME or CREDIT_SIMULATION_PASSWORD not set');
    return null;
  }

  const url = `${resolveApiBaseUrl()}/v3/Auth/Login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      IsRememberMe: true,
    }),
  });

  const text = await res.text();
  let data: LoginResponse;
  try {
    data = JSON.parse(text) as LoginResponse;
  } catch {
    console.warn('Hyundai API: Login response was not JSON');
    return null;
  }

  const token = data?.Token ?? null;
  if (token) {
    cachedToken = token;
    tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
  }
  return token;
}

async function getValidToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60_000) {
    return cachedToken;
  }

  if (!loginInFlight) {
    loginInFlight = login().finally(() => {
      loginInFlight = null;
    });
  }

  return loginInFlight;
}

/**
 * Returns request headers for Hyundai API calls, including AdInsKey (token).
 * Performs Login if no valid cached token (single-flight for concurrent callers).
 */
export async function getHyundaiRequestHeaders(): Promise<Record<string, string>> {
  // Fail closed in production if API_BASE_URL is unset (no silent QA fallback).
  resolveApiBaseUrl();

  const token = await getValidToken();
  if (!token) {
    return { 'Content-Type': 'application/json' };
  }

  return {
    'Content-Type': 'application/json',
    AdInsKey: token,
  };
}
