'use client';

import { useRef, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { IconLock, IconLogout } from '@tabler/icons-react';
import { AdminLink } from '@/app/components/admin/AdminLink';
import { ChangePasswordModal } from '@/app/components/admin/ChangePasswordModal';

export function AdminTopbar() {
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

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-1.5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
        </div>
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-sky-100/80 transition-colors duration-300"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold shrink-0">
              {session.user.name?.charAt(0).toUpperCase() || 'A'}
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
                <IconLock size={16} className="text-gray-700" />
                <span className="text-sm font-medium text-gray-700">Change Password</span>
              </button>
              <AdminLink
                href="/auth/logout"
                className="flex items-center gap-2 px-4 h-10 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                <IconLogout size={16} className="text-gray-700" />
                <span className="text-sm font-medium text-gray-700">Logout</span>
              </AdminLink>
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


