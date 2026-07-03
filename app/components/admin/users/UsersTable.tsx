'use client';

import { useEffect, useState } from 'react';
import { AdminLink } from '@/app/components/admin/AdminLink';
import { IconEdit, IconTrash, IconPlus, IconLockOpen, IconLock } from '@tabler/icons-react';

type User = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  userType?: string | null;
  vendorName?: string | null;
  vendorCity?: string | null;
  createdAt: string;
  lockedUntil?: string | null;
  failedLoginAttempts?: number;
  lastLoginAt?: string | null;
  userRoles: Array<{
    role: {
      name: string;
    };
  }>;
};

const USER_TYPE_LABELS: Record<string, string> = {
  HCFI_ADMIN: 'HCFI Admin',
  DEALER_ADMIN: 'Dealer Admin',
  SALESMAN: 'Salesman',
};

const isLocked = (user: User): boolean =>
  !!user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now();

const formatLockExpiry = (iso: string): string => {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return 'expired';
  const mins = Math.ceil(diffMs / 60_000);
  return mins < 60 ? `${mins} menit` : `${Math.ceil(mins / 60)} jam`;
};

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const loadUsers = () => {
    return fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []));
  };

  useEffect(() => {
    loadUsers()
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (user: User) => {
    if (!confirm(`Yakin ingin menghapus user "${user.name}"?`)) return;
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus user');
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus user');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUnlock = async (user: User) => {
    if (!confirm(`Unlock akun "${user.email}"? Counter percobaan login akan direset.`)) return;
    setUnlockingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/unlock`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal unlock akun');
      await loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal unlock akun');
    } finally {
      setUnlockingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Users</h2>
        <AdminLink
          href="/admin/users/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <IconPlus size={20} />
          Add User
        </AdminLink>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dealer
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 align-top">
                  {user.name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 align-top">
                  {user.email}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 align-top">
                  <div>{user.userRoles.map((ur) => ur.role.name).join(', ') || 'No roles'}</div>
                  {user.userType && (
                    <span className="mt-1 inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                      {USER_TYPE_LABELS[user.userType] ?? user.userType}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500 max-w-[12rem] align-top">
                  {user.vendorName ? (
                    <div className="truncate" title={user.vendorName}>
                      {user.vendorName}
                      {user.vendorCity ? (
                        <span className="block text-[10px] text-gray-400">{user.vendorCity}</span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap align-top">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {isLocked(user) && user.lockedUntil && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 w-fit"
                        title={`Auto-unlock in ${formatLockExpiry(user.lockedUntil)}`}
                      >
                        <IconLock size={12} />
                        Locked
                      </span>
                    )}
                    {!isLocked(user) && (user.failedLoginAttempts ?? 0) > 0 && (
                      <span className="text-[10px] text-gray-500">
                        {user.failedLoginAttempts} gagal login
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium align-top">
                  <div className="flex items-center gap-2">
                    <AdminLink
                      href={`/admin/users/${user.id}/edit`}
                      className="h-8 w-8 flex items-center justify-center hover:bg-blue-100/80 rounded-lg border border-blue-200/80"
                      title="Edit User"
                    >
                      <IconEdit size={18} className="text-blue-500" />
                    </AdminLink>
                    {isLocked(user) && (
                      <button
                        type="button"
                        className="h-8 w-8 flex items-center justify-center cursor-pointer hover:bg-amber-100/80 rounded-lg border border-amber-200/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Unlock account"
                        disabled={unlockingId === user.id}
                        onClick={() => handleUnlock(user)}
                      >
                        <IconLockOpen size={18} className="text-amber-600" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="h-8 w-8 flex items-center justify-center cursor-pointer hover:bg-red-100/80 rounded-lg border border-red-200/80 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete User"
                      disabled={deletingId === user.id}
                      onClick={() => handleDelete(user)}
                    >
                      <IconTrash size={18} className="text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


