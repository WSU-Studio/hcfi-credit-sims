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

function toHyundaiLocationCase(value: string): string {
  return value.trim().toUpperCase();
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
 * Bangun lokasi customer untuk ValidateCustZipCode / AddLeadCust.
 *
 * - ZipCode tetap dari OCR (bukan dealer) supaya alamat customer tidak tertukar.
 * - City diutamakan dari master `GetLocationDataByZipcode` agar match Confins
 *   (mis. OCR "Jakarta Pusat" → master "JAKARTA PUSAT").
 * - AreaCode1/2 tetap dari OCR (kecamatan/kelurahan KTP), di-uppercase.
 * - Fallback: OCR city di-uppercase bila lookup master gagal.
 */
export async function buildCustomerLocationFromOcr(
  ocr: OcrKtpRead | null
): Promise<HyundaiCustomerLocation> {
  const zipCode =
    normalizeIndonesiaZipCode(ocr?.Zipcode) ?? (ocr?.Zipcode?.trim() || '');
  let city = (ocr?.kotaKabupaten ?? '').trim();
  const areaCode1 = (ocr?.kecamatan ?? '').trim();
  const areaCode2 = (ocr?.kelurahanDesa ?? '').trim();
  let province = ocr?.provinsi?.trim() || undefined;

  if (zipCode) {
    const master = await getLocationDataByZipcode(zipCode);
    if (master?.city) {
      city = master.city;
      if (master.province) province = master.province;
    }
  }

  return {
    zipCode,
    city: toHyundaiLocationCase(city),
    areaCode1: toHyundaiLocationCase(areaCode1),
    areaCode2: toHyundaiLocationCase(areaCode2),
    province: province ? toHyundaiLocationCase(province) : undefined,
  };
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
    if (loc) {
      return {
        ...loc,
        city: toHyundaiLocationCase(loc.city),
        areaCode1: toHyundaiLocationCase(loc.areaCode1),
        areaCode2: toHyundaiLocationCase(loc.areaCode2),
        province: loc.province ? toHyundaiLocationCase(loc.province) : undefined,
      };
    }
  }

  throw new Error(
    'Kode pos tidak terdaftar di Hyundai. Upload KTP yang terbaca jelas atau pilih dealer dengan kode pos valid.'
  );
}
