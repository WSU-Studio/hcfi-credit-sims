'use client';

import { useRef, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { IconLock, IconLogout } from '@tabler/icons-react';
import { DealerLink } from '@/app/components/dealer/DealerLink';
import { ChangePasswordModal } from '@/app/components/admin/ChangePasswordModal';
import { USER_TYPES } from '@/lib/user-types';

const USER_TYPE_LABELS: Record<string, string> = {
  [USER_TYPES.DEALER_ADMIN]: 'Dealer Admin',
  [USER_TYPES.SALESMAN]: 'Salesman',
};

export function DealerTopbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session?.user) return null;

  const roleLabel = session.user.userType
    ? USER_TYPE_LABELS[session.user.userType] ?? session.user.userType
    : '';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">Dealer Portal</h2>
          {session.user.vendorName && (
            <p className="text-sm text-gray-500 truncate">
              {session.user.vendorName}
              {session.user.vendorCity ? ` · ${session.user.vendorCity}` : ''}
              {session.user.oriOfficeName ? ` · ${session.user.oriOfficeName}` : ''}
            </p>
          )}
        </div>
        <div className="relative shrink-0" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
              <p className="text-xs text-gray-500">
                {roleLabel}
                {session.user.email ? ` · ${session.user.email}` : ''}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#002c5f] flex items-center justify-center text-white font-semibold">
              {session.user.name?.charAt(0).toUpperCase() || 'D'}
            </div>
          </button>
          {open && (
            <div className="absolute right-0 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setPasswordModalOpen(true);
                }}
                className="flex w-full items-center gap-2 px-4 h-10 text-sm text-gray-700 hover:bg-gray-50"
              >
                <IconLock size={16} />
                Ubah Password
              </button>
              <DealerLink
                href="/auth/logout"
                className="flex items-center gap-2 px-4 h-10 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                <IconLogout size={16} />
                Logout
              </DealerLink>
            </div>
          )}
        </div>
      </div>
      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </header>
  );
}
