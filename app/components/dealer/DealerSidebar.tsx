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
  IconX,
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

type SidebarContentProps = {
  /** Dipanggil saat user memilih menu — dipakai drawer mobile untuk menutup diri. */
  onNavigate?: () => void;
  /** Tombol close hanya ditampilkan pada drawer mobile. */
  onClose?: () => void;
};

function SidebarContent({ onNavigate, onClose }: SidebarContentProps) {
  const pathname = usePathname();
  const { permissions, loading } = useUserPermissions();

  const visibleItems = useMemo(() => {
    if (loading || !permissions) return [];
    return menuItems.filter((item) => permissions[item.code]?.canView === true);
  }, [permissions, loading]);

  return (
    <div className="flex flex-col h-full bg-blue-950 text-white">
      <div className="p-6 border-b border-white/10 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Dealer Portal</h1>
          <p className="text-sm text-white/70 mt-1">Hyundai Capital</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="lg:hidden -mr-2 -mt-1 p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <IconX size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                onClick={onNavigate}
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

      <div className="p-4 border-t border-white/10">
        <DealerLink
          href="/auth/logout?redirect=dealer"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <IconLogout size={20} />
          <span className="text-sm font-medium">Logout</span>
        </DealerLink>
      </div>
    </div>
  );
}

export type DealerSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function DealerSidebar({ mobileOpen, onMobileClose }: DealerSidebarProps) {
  // Kunci scroll body saat drawer mobile terbuka.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="fixed inset-y-0 w-64">
          <SidebarContent />
        </div>
      </aside>

      {/* Drawer mobile */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] shadow-xl transition-transform duration-200 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onNavigate={onMobileClose} onClose={onMobileClose} />
      </div>
    </>
  );
}
