/**
 * Hyundai Credit Simulation API client.
 * - Login (POST /v3/Auth/Login) to obtain token.
 * - Use token in header AdInsKey for all data API calls.
 */

const API_BASE_URL =
  process.env.CREDIT_SIMULATION_API_URL ||
  'https://qaapigwconfins.hyundaicapital.co.id/api/mobileloan';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
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

  const url = `${API_BASE_URL}/v3/Auth/Login`;
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

/**
 * Returns request headers for Hyundai API calls, including AdInsKey (token).
 * Performs Login if no valid cached token.
 */
export async function getHyundaiRequestHeaders(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60_000) {
    return {
      'Content-Type': 'application/json',
      AdInsKey: cachedToken,
    };
  }

  const token = await login();
  if (!token) {
    return { 'Content-Type': 'application/json' };
  }

  return {
    'Content-Type': 'application/json',
    AdInsKey: token,
  };
}

export { API_BASE_URL };
