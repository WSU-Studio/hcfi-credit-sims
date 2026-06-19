import { getHyundaiRequestHeaders, API_BASE_URL } from '@/lib/hyundai-api-client';

export type HyundaiFieldError = {
  Field?: string;
  Message?: string;
};

export type HyundaiApiEnvelope = {
  TrxNo?: string;
  ReturnObject?: unknown;
  HeaderObj?: {
    StatusCode?: string;
    Message?: string;
    ErrorMessages?: Array<string | HyundaiFieldError> | null;
  };
  StatusCode?: string;
  Message?: string;
  ErrorMessages?: Array<string | HyundaiFieldError> | null;
};

/** Format ErrorMessages Hyundai — bisa string atau `{ Field, Message }`. */
export function formatHyundaiErrorMessages(errors: unknown): string {
  if (!Array.isArray(errors) || errors.length === 0) return '';
  return errors
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const e = item as HyundaiFieldError;
        if (e.Field && e.Message) return `${e.Field}: ${e.Message}`;
        if (e.Message) return e.Message;
        try {
          return JSON.stringify(item);
        } catch {
          return String(item);
        }
      }
      return String(item);
    })
    .filter(Boolean)
    .join('; ');
}

export class HyundaiApiError extends Error {
  readonly statusCode?: string;
  readonly response?: HyundaiApiEnvelope;

  constructor(message: string, opts?: { statusCode?: string; response?: HyundaiApiEnvelope }) {
    super(message);
    this.name = 'HyundaiApiError';
    this.statusCode = opts?.statusCode;
    this.response = opts?.response;
  }
}

function collectErrorDetail(envelope: HyundaiApiEnvelope): string {
  const fromHeader = formatHyundaiErrorMessages(envelope.HeaderObj?.ErrorMessages);
  if (fromHeader) return fromHeader;
  return formatHyundaiErrorMessages(envelope.ErrorMessages);
}

function throwHyundaiError(
  envelope: HyundaiApiEnvelope,
  fallback: string,
  httpStatus?: number
): never {
  const detail = collectErrorDetail(envelope);
  const status = envelope.StatusCode ?? envelope.HeaderObj?.StatusCode;
  const msg = [envelope.Message || envelope.HeaderObj?.Message || fallback, detail]
    .filter(Boolean)
    .join(' — ');
  throw new HyundaiApiError(msg, {
    statusCode: status ?? (httpStatus ? String(httpStatus) : undefined),
    response: envelope,
  });
}

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

  if (!res.ok) {
    throwHyundaiError(envelope, text.slice(0, 300) || `Hyundai API error (${res.status})`, res.status);
  }

  const status = envelope.StatusCode ?? envelope.HeaderObj?.StatusCode;
  if (status && status !== '200') {
    throwHyundaiError(envelope, 'Hyundai API returned non-success status');
  }

  return data;
}
