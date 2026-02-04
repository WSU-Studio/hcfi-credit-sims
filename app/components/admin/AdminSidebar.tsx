'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconLayoutDashboard,
  IconUsers,
  IconShield,
  IconPhoto,
  IconShoppingBag,
  IconTag,
  IconNews,
  IconFileText,
  IconSettings,
  IconFolder,
  IconLogout,
  IconPhone,
} from '@tabler/icons-react';

const menuItems = [
  { code: 'DASHBOARD', name: 'Dashboard', path: '/admin/dashboard', icon: IconLayoutDashboard },
  { code: 'USERS', name: 'User Management', path: '/admin/users', icon: IconUsers },
  { code: 'ROLES', name: 'Role & Permission', path: '/admin/roles', icon: IconShield },
  { code: 'BANNERS', name: 'Banner Management', path: '/admin/banners', icon: IconPhoto },
  { code: 'PRODUCTS', name: 'Product Section', path: '/admin/products', icon: IconShoppingBag },
  { code: 'PROMOS', name: 'Promo Management', path: '/admin/promos', icon: IconTag },
  { code: 'ARTICLES', name: 'Article Management', path: '/admin/articles', icon: IconNews },
  { code: 'PAGES', name: 'Static Pages', path: '/admin/pages', icon: IconFileText },
  { code: 'LEADS', name: 'Leads', path: '/admin/leads', icon: IconPhone },
  { code: 'FOOTER', name: 'Footer Settings', path: '/admin/footer', icon: IconSettings },
  { code: 'MEDIA', name: 'Media Library', path: '/admin/media', icon: IconFolder },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="fixed flex flex-col h-full">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">HCFI CMS</h1>
          <p className="text-sm text-gray-400 mt-1">Content Management</p>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-176px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
            
            return (
              <Link
                key={item.code}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800 bg-gray-900">
          <Link
            href="/auth/logout"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <IconLogout size={20} />
            <span className="text-sm font-medium">Logout</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}


