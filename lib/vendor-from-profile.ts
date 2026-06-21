import type { Vendor } from '@/app/types/credit-simulation';

export function vendorFromProfile(profile: {
  vendorCode?: string | null;
  vendorName?: string | null;
  vendorCity?: string | null;
  oriOfficeCode?: string | null;
  oriOfficeName?: string | null;
}): Vendor | null {
  const code = profile.vendorCode?.trim();
  if (!code) return null;

  return {
    VendorCode: code,
    VendorName: profile.vendorName?.trim() || code,
    City: profile.vendorCity?.trim() || '',
    ZipCode: '',
    OriOfficeCode: profile.oriOfficeCode?.trim() || '',
    OriOfficeName: profile.oriOfficeName?.trim() || '',
  };
}
