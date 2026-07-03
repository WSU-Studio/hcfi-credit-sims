/**
 * Konteks partner Hyundai (Postman v1.4).
 *
 * `IsPartner` dipakai di product-rule APIs untuk user perusahaan partner —
 * nantinya mengaktifkan produk/diskon khusus (field `PartnerCode` di response).
 * Fitur bisnis partner belum diimplementasi di sisi kita maupun Hyundai QA;
 * semua call default ke `false` sampai ada sumber kebenaran (mis. flag di Lead).
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

/** Resolve flag partner untuk payload Hyundai (`IsPartner`). */
export function resolveIsPartner(ctx?: HyundaiPartnerContext): boolean {
  if (ctx?.isPartner === true) return true;
  return !!normalizePartnerCode(ctx?.partnerCode ?? '');
}

/**
 * Cek apakah `PartnerCode` sebuah produk cocok dengan partner code yang diinput
 * customer. Aturan (per tim Hyundai, WA 2026-07):
 *   - Produk tanpa PartnerCode (null/kosong) = promo publik → selalu cocok.
 *   - Produk dengan PartnerCode → cocok hanya jika sama (setelah normalisasi)
 *     dengan partner code yang diinput. Kalau tidak cocok → produk di-drop
 *     (customer cuma lihat standard).
 */
export function matchesPartnerCode(
  productPartnerCode: string | null | undefined,
  inputPartnerCode: string | null | undefined
): boolean {
  const product = normalizePartnerCode(productPartnerCode ?? '');
  if (!product) return true;
  return product === normalizePartnerCode(inputPartnerCode ?? '');
}

/**
 * Saring daftar produk promosi berdasarkan pencocokan `PartnerCode`. Dipakai
 * untuk menentukan produk promotion mana yang boleh tampil sesuai partner code
 * yang diinput. Generic supaya reusable untuk tipe produk apa pun yang punya
 * field `PartnerCode`.
 */
export function filterPromotionByPartnerCode<
  T extends { PartnerCode?: string | null }
>(products: T[], inputPartnerCode: string | null | undefined): T[] {
  return products.filter((product) =>
    matchesPartnerCode(product.PartnerCode, inputPartnerCode)
  );
}

/** Partner fields untuk request body Hyundai (Postman v1.4). */
export function applyPartnerFields(
  fields: Record<string, unknown>,
  partnerCode?: string | null
): Record<string, unknown> {
  const code = normalizePartnerCode(partnerCode ?? '');
  if (!code) {
    return { ...fields, IsPartner: false };
  }
  return {
    ...fields,
    IsPartner: true,
    PartnerCode: code,
  };
}
