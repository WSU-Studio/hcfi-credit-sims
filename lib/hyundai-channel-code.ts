import { LEAD_SOURCES } from '@/lib/lead-source';

/**
 * Confins `MrChannelCode` — Postman v1.10 / `ref_master.MasterTypeCode = 'MR_CHANNEL_CODE'`.
 *
 * Dipakai hanya di `AddLeadAsset` untuk membedakan lead customer vs salesman dealer.
 * Nilai lama `"WEBSITE"` sudah tidak valid.
 */
export const HYUNDAI_CHANNEL_CODES = {
  CUSTOMER: 'WEBSITE_CUST',
  SALES: 'WEBSITE_SALES',
} as const;

export type HyundaiChannelCode =
  (typeof HYUNDAI_CHANNEL_CODES)[keyof typeof HYUNDAI_CHANNEL_CODES];

export function mrChannelCodeFromLeadSource(
  source?: string | null
): HyundaiChannelCode {
  return source === LEAD_SOURCES.DEALER_SALES
    ? HYUNDAI_CHANNEL_CODES.SALES
    : HYUNDAI_CHANNEL_CODES.CUSTOMER;
}

/**
 * Channel untuk AddLeadAsset di Step 4.
 * `WEBSITE_SALES` hanya jika halaman quotation dealer DAN session salesman valid —
 * client tidak bisa spoof channel sales dari website publik.
 */
export function resolveAddLeadAssetChannelCode(params: {
  leadSource?: string | null;
  isAuthenticatedDealerSales: boolean;
}): HyundaiChannelCode {
  if (
    params.leadSource === LEAD_SOURCES.DEALER_SALES &&
    params.isAuthenticatedDealerSales
  ) {
    return HYUNDAI_CHANNEL_CODES.SALES;
  }
  return HYUNDAI_CHANNEL_CODES.CUSTOMER;
}
