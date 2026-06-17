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
};

/** Resolve flag partner untuk payload Hyundai (`IsPartner`). */
export function resolveIsPartner(ctx?: HyundaiPartnerContext): boolean {
  return ctx?.isPartner === true;
}
