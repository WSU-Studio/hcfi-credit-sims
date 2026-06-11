/**
 * Logger untuk request + response Hyundai API call yang krusial untuk
 * troubleshooting dengan tim Hyundai. Hanya endpoint yang ada di
 * `LOGGED_ENDPOINTS` yang di-track—untuk menghindari log noise dari call
 * repetitive (Login, dropdown, dst).
 *
 * Design:
 * - Wrapper di atas `hyundaiPost` (single-source-of-truth untuk HTTP call).
 * - Logging non-blocking: kalau persist log gagal, tidak melempar exception
 *   ke caller (main flow tetap jalan/throw error sesuai hasil API).
 * - Body JSON dibersihkan dari field "berat" (mis. base64 KTP) untuk hindari
 *   record DB membengkak.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hyundaiPost, type HyundaiApiEnvelope } from '@/lib/hyundai-api-post';
import { API_BASE_URL } from '@/lib/hyundai-api-client';

export const LOGGED_ENDPOINTS = [
  'SaveFinalCalculateResult',
  'FinalCalculateByLeadNo',
  'AddLeadCust',
] as const;

export type LoggedEndpoint = (typeof LOGGED_ENDPOINTS)[number];

export type HyundaiCallLogMeta = {
  endpoint: LoggedEndpoint;
  leadId?: string | null;
  hyundaiLeadNo?: string | null;
};

/**
 * Buang field base64 yang besar (`IdFile.Content` di AddLeadCust) supaya
 * record DB tetap kecil. Tetap simpan FileName-nya untuk traceability.
 */
function sanitizeForPersist(body: Record<string, unknown>): Record<string, unknown> {
  const idFile = body.IdFile;
  if (idFile && typeof idFile === 'object' && idFile !== null) {
    const fileObj = idFile as { FileName?: string; Content?: string };
    if (fileObj.Content) {
      return {
        ...body,
        IdFile: {
          FileName: fileObj.FileName ?? null,
          Content: '<base64 omitted>',
          ContentBytes: typeof fileObj.Content === 'string' ? fileObj.Content.length : 0,
        },
      };
    }
  }
  return body;
}

async function persistLog(data: {
  endpoint: LoggedEndpoint;
  leadId?: string | null;
  hyundaiLeadNo?: string | null;
  url: string;
  status: 'SUCCESS' | 'FAILED';
  httpStatus?: number | null;
  hyundaiStatus?: string | null;
  hyundaiMessage?: string | null;
  requestBody: Record<string, unknown>;
  responseBody?: unknown;
  errorMessage?: string | null;
  durationMs: number;
}): Promise<void> {
  try {
    await prisma.hyundaiApiCallLog.create({
      data: {
        endpoint: data.endpoint,
        leadId: data.leadId ?? null,
        hyundaiLeadNo: data.hyundaiLeadNo ?? null,
        url: data.url,
        status: data.status,
        httpStatus: data.httpStatus ?? null,
        hyundaiStatus: data.hyundaiStatus ?? null,
        hyundaiMessage: data.hyundaiMessage ?? null,
        requestBody: sanitizeForPersist(data.requestBody) as Prisma.InputJsonValue,
        responseBody:
          data.responseBody === undefined || data.responseBody === null
            ? Prisma.DbNull
            : (data.responseBody as Prisma.InputJsonValue),
        errorMessage: data.errorMessage ?? null,
        durationMs: data.durationMs,
      },
    });
  } catch (logErr) {
    console.warn(
      '[hyundai-api-log] gagal persist log (non-fatal):',
      logErr instanceof Error ? logErr.message : logErr
    );
  }
}

/**
 * Drop-in replacement untuk `hyundaiPost` yang otomatis log ke
 * `HyundaiApiCallLog`. Pakai di chain admin submit untuk endpoint krusial.
 *
 * Gunakan signature yang sama dengan `hyundaiPost` plus extra `meta` —
 * caller cukup mengganti import & nama fungsi.
 */
export async function hyundaiPostLogged<T = HyundaiApiEnvelope>(
  path: string,
  body: Record<string, unknown>,
  meta: HyundaiCallLogMeta
): Promise<T> {
  const startMs = Date.now();
  const url = `${API_BASE_URL}${path}`;

  try {
    const data = await hyundaiPost<T>(path, body);
    const envelope = data as unknown as HyundaiApiEnvelope;
    await persistLog({
      ...meta,
      url,
      status: 'SUCCESS',
      httpStatus: 200, // hyundaiPost throw kalau bukan 2xx, jadi sukses pasti 200
      hyundaiStatus: envelope.StatusCode ?? envelope.HeaderObj?.StatusCode ?? null,
      hyundaiMessage: envelope.Message ?? envelope.HeaderObj?.Message ?? null,
      requestBody: body,
      responseBody: data as unknown,
      durationMs: Date.now() - startMs,
    });
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await persistLog({
      ...meta,
      url,
      status: 'FAILED',
      requestBody: body,
      errorMessage: message,
      durationMs: Date.now() - startMs,
    });
    throw err;
  }
}
