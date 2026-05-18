import { getHyundaiRequestHeaders, API_BASE_URL } from '@/lib/hyundai-api-client';

export type HyundaiApiEnvelope = {
  TrxNo?: string;
  ReturnObject?: unknown;
  HeaderObj?: {
    StatusCode?: string;
    Message?: string;
    ErrorMessages?: string[] | null;
  };
  StatusCode?: string;
  Message?: string;
  ErrorMessages?: string[] | null;
};

export async function hyundaiPost<T = HyundaiApiEnvelope>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const headers = await getHyundaiRequestHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: T & HyundaiApiEnvelope;
  try {
    data = text ? JSON.parse(text) : ({} as T);
  } catch {
    throw new Error('Invalid response from Hyundai API');
  }

  const envelope = data as HyundaiApiEnvelope;
  const headerErrors = envelope.HeaderObj?.ErrorMessages;
  const detail = Array.isArray(headerErrors)
    ? headerErrors.filter(Boolean).join('; ')
    : Array.isArray(envelope.ErrorMessages)
      ? envelope.ErrorMessages.filter(Boolean).join('; ')
      : '';

  if (!res.ok) {
    const msg =
      envelope.Message ||
      detail ||
      text.slice(0, 300) ||
      `Hyundai API error (${res.status})`;
    throw new Error(msg);
  }

  const status = envelope.StatusCode ?? envelope.HeaderObj?.StatusCode;
  if (status && status !== '200') {
    const msg = [envelope.Message || 'Hyundai API returned non-success status', detail]
      .filter(Boolean)
      .join(' — ');
    throw new Error(msg);
  }

  return data;
}
