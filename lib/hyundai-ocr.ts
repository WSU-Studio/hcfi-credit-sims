import { API_BASE_URL, getHyundaiRequestHeaders } from '@/lib/hyundai-api-client';

export type OcrKtpRead = {
  agama?: string;
  alamat?: string;
  berlakuHingga?: string;
  golonganDarah?: string;
  is_ektp?: boolean;
  jenisKelamin?: string;
  kecamatan?: string;
  kelurahanDesa?: string;
  mrNationalityCode?: string;
  kewarganegaraan?: string;
  kotaKabupaten?: string;
  nama?: string;
  nik?: string;
  pekerjaan?: string;
  provinsi?: string;
  rtRw?: string | null;
  Rt?: string;
  Rw?: string;
  Zipcode?: string;
  statusPerkawinan?: string;
  tanggalLahir?: string;
  tempatLahir?: string;
};

export type OcrKtpResponse = {
  Read?: OcrKtpRead;
  HeaderObj?: { StatusCode?: string; Message?: string };
  StatusCode?: string;
  Message?: string;
};

/**
 * Custom error agar caller bisa simpan response Hyundai apa adanya untuk
 * troubleshooting. Tanpa ini, kita hanya tahu error message string.
 */
export class HyundaiOcrError extends Error {
  rawResponse: unknown;
  constructor(message: string, rawResponse: unknown) {
    super(message);
    this.name = 'HyundaiOcrError';
    this.rawResponse = rawResponse;
  }
}

export type OcrKtpRequestBody = {
  trxNo: string;
  fileName: string;
  source: string;
  byteBase64: string;
};

export type OcrKtpRequest = {
  url: string;
  method: 'POST';
  headers: Record<string, string>;
  body: OcrKtpRequestBody;
};

/**
 * Susun semua bahan request OCR (URL, headers ber-token, body JSON) tanpa
 * meng-execute fetch. Berguna untuk:
 *   - getOcrKtpData (call & parse)
 *   - tool diagnostik di /admin/lead-ocr (re-export ke Postman / cURL)
 */
export async function buildOcrKtpRequest(params: {
  trxNo: string;
  fileName: string;
  byteBase64: string;
  source?: string;
}): Promise<OcrKtpRequest> {
  const headers = await getHyundaiRequestHeaders();
  return {
    url: `${API_BASE_URL}/v1/OCR/GetOCRKTPData`,
    method: 'POST',
    headers,
    body: {
      trxNo: params.trxNo,
      fileName: params.fileName,
      source: params.source ?? 'Website',
      byteBase64: params.byteBase64,
    },
  };
}

/**
 * Parse + validasi response Hyundai OCR. Throw HyundaiOcrError dengan raw
 * response menempel kalau bermasalah (status code != 200, Read kosong, dll).
 */
export function parseOcrKtpResponse(rawText: string, httpOk: boolean, httpStatus: number): OcrKtpResponse {
  let data: OcrKtpResponse;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new HyundaiOcrError('Invalid OCR response from Hyundai API', {
      rawText: rawText.slice(0, 500),
    });
  }

  if (!httpOk) {
    throw new HyundaiOcrError(
      data.Message || rawText.slice(0, 300) || `OCR API error (${httpStatus})`,
      data
    );
  }

  const status = data.StatusCode ?? data.HeaderObj?.StatusCode;
  if (status && status !== '200') {
    throw new HyundaiOcrError(data.Message || 'OCR returned non-success status', data);
  }

  if (!data.Read) {
    throw new HyundaiOcrError('OCR response missing Read data', data);
  }

  return data;
}

export async function getOcrKtpData(params: {
  trxNo: string;
  fileName: string;
  byteBase64: string;
  source?: string;
}): Promise<OcrKtpResponse> {
  const req = await buildOcrKtpRequest(params);
  const res = await fetch(req.url, {
    method: req.method,
    headers: req.headers,
    body: JSON.stringify(req.body),
  });
  const text = await res.text();
  return parseOcrKtpResponse(text, res.ok, res.status);
}

/** Normalize date to YYYY-MM-DD for Hyundai API */
export function normalizeBirthDate(raw?: string): string {
  if (!raw) return '1990-01-01';
  const dmy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return '1990-01-01';
}

export function mapGender(code?: string): string {
  if (!code) return 'MALE';
  const u = code.toUpperCase();
  if (u.includes('FEMALE') || u === 'F' || u === 'PEREMPUAN') return 'FEMALE';
  return 'MALE';
}

export function mapMarital(code?: string): string {
  if (!code) return 'SINGLE';
  const u = code.toUpperCase();
  if (u.includes('MARRIED') || u.includes('KAWIN')) return 'MARRIED';
  return 'SINGLE';
}
