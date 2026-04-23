export type AdminMenuConfig = {
  code: string;
  name: string;
  path: string;
  order: number;
};

export const ADMIN_MENUS: AdminMenuConfig[] = [
  { code: 'DASHBOARD', name: 'Dashboard', path: '/admin/dashboard', order: 1 },
  { code: 'USERS', name: 'User Management', path: '/admin/users', order: 2 },
  { code: 'ROLES', name: 'Role & Permission', path: '/admin/roles', order: 3 },
  { code: 'BANNERS', name: 'Banner Management', path: '/admin/banners', order: 4 },
  { code: 'BENEFITS', name: 'Benefit Settings', path: '/admin/benefits', order: 11 },
  { code: 'PRODUCTS', name: 'Product Section', path: '/admin/products', order: 5 },
  { code: 'PROMOS', name: 'Promo Management', path: '/admin/promos', order: 6 },
  { code: 'ARTICLES', name: 'Article Management', path: '/admin/articles', order: 7 },
  { code: 'PAGES', name: 'Static Pages', path: '/admin/pages', order: 8 },
  { code: 'LEADS', name: 'Leads', path: '/admin/leads', order: 9 },
  { code: 'FOOTER', name: 'Footer Settings', path: '/admin/footer', order: 10 },
  { code: 'VEHICLE_MODELS', name: 'Vehicle Model Images', path: '/admin/vehicle-models', order: 11 },
  { code: 'MEDIA', name: 'Media Library', path: '/admin/media', order: 12 },
  { code: 'SETTINGS', name: 'Site Settings', path: '/admin/settings', order: 13 },
];

