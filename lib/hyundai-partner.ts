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

export function normalizePartnerCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32);
}

/** Resolve flag partner untuk payload Hyundai (`IsPartner`). */
export function resolveIsPartner(ctx?: HyundaiPartnerContext): boolean {
  if (ctx?.isPartner === true) return true;
  return !!normalizePartnerCode(ctx?.partnerCode ?? '');
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
