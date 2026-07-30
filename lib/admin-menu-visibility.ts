import type { AdminMenuConfig } from '@/lib/admin-menus';
import { ADMIN_MENUS } from '@/lib/admin-menus';

export type MenuPermissionFlags = {
  canView?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

export type MenuPermissionsMap = Record<string, MenuPermissionFlags>;

/** LEAD_OCR is reachable with either LEAD_OCR or LEADS view access. */
export function canViewAdminMenu(
  permissions: MenuPermissionsMap | null | undefined,
  menuCode: string
): boolean {
  if (!permissions) return false;
  if (menuCode === 'LEAD_OCR') {
    return (
      permissions.LEAD_OCR?.canView === true || permissions.LEADS?.canView === true
    );
  }
  return permissions[menuCode]?.canView === true;
}

export function getVisibleAdminMenus(
  permissions: MenuPermissionsMap | null | undefined,
  menus: AdminMenuConfig[] = ADMIN_MENUS
): AdminMenuConfig[] {
  if (!permissions) return [];
  return menus.filter((menu) => canViewAdminMenu(permissions, menu.code));
}

export function getVisibleAdminMenuCodes(
  permissions: MenuPermissionsMap | null | undefined,
  menus: AdminMenuConfig[] = ADMIN_MENUS
): string[] {
  return getVisibleAdminMenus(permissions, menus).map((menu) => menu.code);
}
