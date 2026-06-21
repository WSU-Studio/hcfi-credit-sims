import menusData from './dealer-menus.data.json';

export type DealerMenuConfig = {
  code: string;
  name: string;
  path: string;
  order: number;
};

export const DEALER_MENUS: DealerMenuConfig[] = menusData as DealerMenuConfig[];
