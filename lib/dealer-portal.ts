import { isDealerPortalUserType } from '@/lib/user-types';

export const DEALER_PORTAL_HOME = '/dealer/dashboard';
export const DEALER_LOGIN_PATH = '/dealer/login';
export const CMS_LOGIN_PATH = '/auth/login';
export const CMS_HOME = '/admin/dashboard';

export function isDealerPortalUser(
  userType: string | null | undefined
): boolean {
  return isDealerPortalUserType(userType);
}

export type DealerProfile = {
  vendorCode: string | null;
  vendorName: string | null;
  vendorCity: string | null;
  oriOfficeCode: string | null;
  oriOfficeName: string | null;
  cmoEmpNo: string | null;
};

export function pickDealerProfile(user: {
  vendorCode?: string | null;
  vendorName?: string | null;
  vendorCity?: string | null;
  oriOfficeCode?: string | null;
  oriOfficeName?: string | null;
  cmoEmpNo?: string | null;
}): DealerProfile {
  return {
    vendorCode: user.vendorCode ?? null,
    vendorName: user.vendorName ?? null,
    vendorCity: user.vendorCity ?? null,
    oriOfficeCode: user.oriOfficeCode ?? null,
    oriOfficeName: user.oriOfficeName ?? null,
    cmoEmpNo: user.cmoEmpNo ?? null,
  };
}
