import { hyundaiPost } from '@/lib/hyundai-api-post';
import type { OcrKtpRead } from '@/lib/hyundai-ocr';

export type HyundaiCustomerLocation = {
  zipCode: string;
  city: string;
  areaCode1: string;
  areaCode2: string;
  province?: string;
};

type LocationByZipResponse = {
  StatusCode?: string;
  City?: string;
  AreaCode1?: string;
  AreaCode2?: string;
  Province?: string;
  Message?: string;
};

/** Extract 5-digit Indonesian postal code from OCR / free text */
export function normalizeIndonesiaZipCode(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 5) return digits.slice(0, 5);
  return null;
}

export async function getLocationDataByZipcode(
  zipCode: string
): Promise<HyundaiCustomerLocation | null> {
  try {
    const data = await hyundaiPost<LocationByZipResponse>(
      '/v1/LeadCust/GetLocationDataByZipcode',
      { ZipCode: zipCode }
    );
    if (!data.City || !data.AreaCode1) return null;
    return {
      zipCode,
      city: data.City,
      areaCode1: data.AreaCode1,
      areaCode2: data.AreaCode2 || data.AreaCode1,
      province: data.Province,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve ZipCode + City + AreaCode1/2 that exist in Hyundai master data.
 * Tries OCR zip first, then dealer zip from vendor assignment.
 */
export async function resolveCustomerLocation(params: {
  ocr: OcrKtpRead | null;
  vendorZipCode?: string | null;
}): Promise<HyundaiCustomerLocation> {
  const candidates: string[] = [];
  const ocrZip = normalizeIndonesiaZipCode(params.ocr?.Zipcode);
  const vendorZip = normalizeIndonesiaZipCode(params.vendorZipCode);
  if (ocrZip) candidates.push(ocrZip);
  if (vendorZip && !candidates.includes(vendorZip)) candidates.push(vendorZip);

  for (const zip of candidates) {
    const loc = await getLocationDataByZipcode(zip);
    if (loc) return loc;
  }

  throw new Error(
    'Kode pos tidak terdaftar di Hyundai. Upload KTP yang terbaca jelas atau pilih dealer dengan kode pos valid.'
  );
}
