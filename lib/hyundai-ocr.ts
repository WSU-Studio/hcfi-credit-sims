import { API_BASE_URL, getHyundaiRequestHeaders } from '@/lib/hyundai-api-client';
import { sanitizeBase64ForHyundai } from '@/lib/hyundai-file-content';

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
  const byteBase64 = sanitizeBase64ForHyundai(params.byteBase64, 'KTP');
  return {
    url: `${API_BASE_URL}/v1/OCR/GetOCRKTPData`,
    method: 'POST',
    headers,
    body: {
      trxNo: params.trxNo,
      fileName: params.fileName,
      source: params.source ?? 'Website',
      byteBase64,
    },
  };
}

export type OcrAnalysisCategory =
  | 'SUCCESS'         // HTTP 2xx + StatusCode 200 + Read terisi
  | 'EMPTY_READ'      // HTTP 2xx + StatusCode 200, tapi Read = null/empty (engine OCR gagal baca gambar)
  | 'HTTP_ERROR'      // HTTP non-2xx (network/auth/server error)
  | 'API_ERROR'       // HTTP 2xx tapi StatusCode != "200" (validasi Hyundai)
  | 'INVALID_JSON';   // response bukan JSON valid

export type OcrAnalysisResult = {
  category: OcrAnalysisCategory;
  data: OcrKtpResponse | null;
  errorMessage: string | null;
  /**
   * Penjelasan teknis untuk admin/tool diagnostik (boleh detail).
   * Jangan tampilkan ke user publik.
   */
  diagnosis: string;
  /** Pesan singkat untuk UI publik (ContactModal). Tanpa nama vendor/API. */
  userMessage: string;
};

/** Diagnostik internal admin — jangan di-render di ContactModal. */
const DIAGNOSIS_BY_CATEGORY: Record<OcrAnalysisCategory, string> = {
  SUCCESS: 'OCR berhasil membaca data KTP dari gambar.',
  EMPTY_READ:
    'HTTP/Status sukses tapi field Read kosong — biasanya kualitas/konten gambar (blur, gelap, terpotong).',
  HTTP_ERROR: 'Upstream OCR mengembalikan HTTP non-2xx (token, jaringan, atau server).',
  API_ERROR: 'Upstream OCR HTTP 200 tapi StatusCode internal != 200 (validasi business rule).',
  INVALID_JSON: 'Response OCR bukan JSON valid (HTML error page atau timeout).',
};

/** Pesan untuk end-user di credit simulation. */
const USER_MESSAGE_BY_CATEGORY: Record<OcrAnalysisCategory, string> = {
  SUCCESS: 'Data KTP berhasil dibaca. Silakan periksa kembali hasilnya.',
  EMPTY_READ:
    'Foto KTP belum bisa dibaca. Silakan unggah ulang foto yang lebih jelas, terang, dan tidak blur.',
  HTTP_ERROR:
    'Gagal membaca data KTP. Silakan coba lagi beberapa saat, atau unggah ulang foto yang lebih jelas.',
  API_ERROR:
    'Gagal membaca data KTP. Silakan coba lagi, atau unggah ulang foto yang lebih jelas.',
  INVALID_JSON:
    'Gagal membaca data KTP. Silakan coba lagi beberapa saat.',
};

/**
 * Lenient analyzer: TIDAK throw. Cocok untuk tool diagnostik di
 * /admin/lead-ocr — admin perlu tahu kategori kegagalan untuk debugging.
 *
 * Kontras dengan parseOcrKtpResponse() yang throw — itu dipakai di flow
 * production (submitLeadToHyundai) supaya Read kosong tidak diam-diam
 * dilewatkan dan kirim placeholder NIK ke AddLeadCust.
 */
export function analyzeOcrKtpResponse(
  rawText: string,
  httpOk: boolean,
  _httpStatus: number
): OcrAnalysisResult {
  let data: OcrKtpResponse | null = null;
  try {
    data = rawText ? (JSON.parse(rawText) as OcrKtpResponse) : {};
  } catch {
    return {
      category: 'INVALID_JSON',
      data: null,
      errorMessage: USER_MESSAGE_BY_CATEGORY.INVALID_JSON,
      diagnosis: DIAGNOSIS_BY_CATEGORY.INVALID_JSON,
      userMessage: USER_MESSAGE_BY_CATEGORY.INVALID_JSON,
    };
  }

  if (!httpOk) {
    return {
      category: 'HTTP_ERROR',
      data,
      errorMessage: USER_MESSAGE_BY_CATEGORY.HTTP_ERROR,
      diagnosis: DIAGNOSIS_BY_CATEGORY.HTTP_ERROR,
      userMessage: USER_MESSAGE_BY_CATEGORY.HTTP_ERROR,
    };
  }

  const apiStatus = data?.StatusCode ?? data?.HeaderObj?.StatusCode;
  if (apiStatus && apiStatus !== '200') {
    return {
      category: 'API_ERROR',
      data,
      errorMessage: USER_MESSAGE_BY_CATEGORY.API_ERROR,
      diagnosis: DIAGNOSIS_BY_CATEGORY.API_ERROR,
      userMessage: USER_MESSAGE_BY_CATEGORY.API_ERROR,
    };
  }

  if (!data?.Read) {
    return {
      category: 'EMPTY_READ',
      data,
      errorMessage: null,
      diagnosis: DIAGNOSIS_BY_CATEGORY.EMPTY_READ,
      userMessage: USER_MESSAGE_BY_CATEGORY.EMPTY_READ,
    };
  }

  return {
    category: 'SUCCESS',
    data,
    errorMessage: null,
    diagnosis: DIAGNOSIS_BY_CATEGORY.SUCCESS,
    userMessage: USER_MESSAGE_BY_CATEGORY.SUCCESS,
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

/** RT/RW wajib 3 digit di AddLeadCust. OCR sering mengembalikan "-" jika tidak terbaca. */
export function normalizeRtRw(raw?: string | null): string {
  if (!raw) return '001';
  const trimmed = raw.trim();
  if (!trimmed || /^-+$/.test(trimmed)) return '001';
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '001';
  if (digits.length >= 3) return digits.slice(-3);
  return digits.padStart(3, '0');
}
