/**
 * Client-side fetch helper for simulation APIs.
 * - Retries transient 502/503/504 (and network errors)
 * - Honors AbortSignal so Strict Mode remounts / unmounts do not set stale errors
 */

export class SimulationFetchError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'SimulationFetchError';
    this.status = status;
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function isRetryableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

export type FetchSimulationJsonOptions = {
  url: string;
  body?: unknown;
  signal?: AbortSignal;
  /** Extra attempts after the first (default 2 → up to 3 total). */
  retries?: number;
  /** Base delay; multiplied by attempt number (default 400ms). */
  retryDelayMs?: number;
};

/**
 * POST JSON to a simulation API route with transient-error retry.
 */
export async function fetchSimulationJson<T>(
  options: FetchSimulationJsonOptions
): Promise<T> {
  const {
    url,
    body,
    signal,
    retries = 2,
    retryDelayMs = 400,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data &&
          typeof data === 'object' &&
          'error' in data &&
          typeof (data as { error?: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Request failed';

        if (isRetryableStatus(response.status) && attempt < retries) {
          await delay(retryDelayMs * (attempt + 1), signal);
          continue;
        }

        throw new SimulationFetchError(message, response.status);
      }

      return data as T;
    } catch (error) {
      if (isAbortError(error)) throw error;
      if (error instanceof SimulationFetchError) throw error;

      lastError = error;
      if (attempt < retries) {
        await delay(retryDelayMs * (attempt + 1), signal);
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed');
}
