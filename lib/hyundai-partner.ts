/**
 * Konteks partner Hyundai (Postman v1.4).
 *
 * `IsPartner` dipakai di product-rule APIs untuk user perusahaan partner —
 * mengaktifkan filter produk di sisi Hyundai (field `PartnerCode` di response).
 *
 * Alur UI:
 * 1. Partner code kosong → IsPartner=false (daftar penuh).
 * 2. Partner code terisi → fetch IsPartner=true, lalu cocokkan PartnerCode
 *    di response. Kalau tidak ada yang match → fallback IsPartner=false.
 */

export const DEFAULT_IS_PARTNER = false;

export type HyundaiPartnerContext = {
  /** true = lead/user dari perusahaan partner Hyundai (diskon khusus). */
  isPartner?: boolean | null;
  partnerCode?: string | null;
};

/** Panjang maksimum partner code yang diterima/dikirim. */
export const MAX_PARTNER_CODE_LENGTH = 64;

/**
 * Normalisasi partner code untuk pencocokan & payload Hyundai.
 *
 * Partner code bisa mengandung spasi dan karakter spesial (mis.
 * "CPP SINARMAS #01"), jadi jangan buang karakter apa pun. Cukup rapikan
 * whitespace (runtun jadi satu spasi + trim), uppercase supaya pencocokan
 * case-insensitive, lalu batasi panjang.
 */
export function normalizePartnerCode(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, MAX_PARTNER_CODE_LENGTH);
}

/**
 * Partner code kosong / placeholder Hyundai ("-") dianggap tidak punya partner.
 */
export function hasMeaningfulPartnerCode(value: string | null | undefined): boolean {
  const code = normalizePartnerCode(value ?? '');
  return !!code && code !== '-';
}

/** Resolve flag partner untuk payload Hyundai (`IsPartner`). */
export function resolveIsPartner(ctx?: HyundaiPartnerContext): boolean {
  if (ctx?.isPartner === true) return true;
  return hasMeaningfulPartnerCode(ctx?.partnerCode);
}

/**
 * True jika ada produk di response yang PartnerCode-nya sama dengan input user.
 * Dipakai untuk memutuskan apakah hasil IsPartner=true valid, atau harus
 * fallback ke IsPartner=false.
 */
export function responseMatchesPartnerCode(
  products: Array<{ PartnerCode?: string | null } | null | undefined>,
  inputPartnerCode: string | null | undefined
): boolean {
  const input = normalizePartnerCode(inputPartnerCode ?? '');
  if (!input || input === '-') return false;
  return products.some(
    (product) =>
      hasMeaningfulPartnerCode(product?.PartnerCode) &&
      normalizePartnerCode(product?.PartnerCode ?? '') === input
  );
}

/** Partner fields untuk request body Hyundai (Postman v1.4). */
export function applyPartnerFields(
  fields: Record<string, unknown>,
  partnerCode?: string | null
): Record<string, unknown> {
  const code = normalizePartnerCode(partnerCode ?? '');
  if (!code || code === '-') {
    return { ...fields, IsPartner: false };
  }
  return {
    ...fields,
    IsPartner: true,
    PartnerCode: code,
  };
}
