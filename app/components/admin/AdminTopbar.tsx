'use client';

import { useSession } from 'next-auth/react';

export function AdminTopbar() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
        </div>
        <div className="flex items-center gap-4">
          {session?.user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="text-xs text-gray-500">{session.user.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {session.user.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


