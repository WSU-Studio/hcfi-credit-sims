'use client';

import { useEffect, useMemo } from 'react';
import type { ComponentType } from 'react';
import { usePathname } from 'next/navigation';
import {
  IconLayoutDashboard,
  IconTag,
  IconFileInvoice,
  IconPhone,
  IconLogout,
} from '@tabler/icons-react';
import { DealerLink } from '@/app/components/dealer/DealerLink';
import { useUserPermissions } from '@/app/hooks/usePermission';
import { DEALER_MENUS } from '@/lib/dealer-menus';

const menuIcons: Record<string, ComponentType<{ size?: number }>> = {
  DEALER_DASHBOARD: IconLayoutDashboard,
  DEALER_PROMOTIONS: IconTag,
  DEALER_QUOTATION: IconFileInvoice,
  DEALER_LEADS: IconPhone,
};

const menuItems = DEALER_MENUS.map((menu) => ({
  code: menu.code,
  name: menu.name,
  path: menu.path,
  icon: menuIcons[menu.code] ?? IconLayoutDashboard,
}));

export function DealerSidebar() {
  const pathname = usePathname();
  const { permissions, loading } = useUserPermissions();

  const visibleItems = useMemo(() => {
    if (loading || !permissions) return [];
    return menuItems.filter((item) => permissions[item.code]?.canView === true);
  }, [permissions, loading]);

  return (
    <aside className="w-64 bg-[#002c5f] text-white min-h-screen">
      <div className="fixed flex flex-col h-full w-64">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold">Dealer Portal</h1>
          <p className="text-sm text-white/70 mt-1">Hyundai Capital</p>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-176px)]">
          {loading ? (
            <p className="px-4 py-3 text-sm text-white/60">Memuat menu...</p>
          ) : (
            visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.path || pathname?.startsWith(item.path + '/');

              return (
                <DealerLink
                  key={item.code}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white ring-1 ring-white/20'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.name}</span>
                </DealerLink>
              );
            })
          )}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-white/10 bg-[#002c5f]">
          <DealerLink
            href="/auth/logout"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <IconLogout size={20} />
            <span className="text-sm font-medium">Logout</span>
          </DealerLink>
        </div>
      </div>
    </aside>
  );
}
