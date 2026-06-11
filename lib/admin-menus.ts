import menusData from './admin-menus.data.json';

export type AdminMenuConfig = {
  code: string;
  name: string;
  path: string;
  order: number;
};

export const ADMIN_MENUS: AdminMenuConfig[] = menusData as AdminMenuConfig[];
