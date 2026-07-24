'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLink } from '@/app/components/admin/AdminLink';
import { DEALER_MENUS } from '@/lib/dealer-menus';

const DEALER_MENU_CODES = new Set(DEALER_MENUS.map((menu) => menu.code));

type Permission = {
  id: string;
  menuCode: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  menu: { name: string; code: string; order: number };
};

type Activity = {
  id: string;
  name: string;
};

const ACTIVITIES: Activity[] = [
  {
    id: 'leads.changeFollowUpStatus',
    name: 'Boleh mengubah status follow up pada Leads',
  },
  {
    id: 'leads.downloadLeads',
    name: 'Boleh mengunduh daftar Leads',
  },
  {
    id: 'leads.assignToCmo',
    name: 'Boleh assign dealer & CMO lalu submit ke Confins',
  },
  {
    id: 'leads.editOcrSnapshot',
    name: 'Boleh mengedit data identitas KTP (OCR snapshot) sebelum submit',
  },
  {
    id: 'leads.purgeAll',
    name: 'Boleh menghapus SEMUA leads (Danger Zone — hanya untuk reset data uji)',
  },
];

type RoleFormProps = {
  roleId?: string;
};

type PermissionChecklistProps = {
  permissions: Permission[];
  selectedPermissionIds: Set<string>;
  onToggle: (id: string) => void;
  emptyMessage?: string;
};

function PermissionChecklist({
  permissions,
  selectedPermissionIds,
  onToggle,
  emptyMessage,
}: PermissionChecklistProps) {
  if (permissions.length === 0) {
    return emptyMessage ? (
      <p className="text-sm text-gray-500">{emptyMessage}</p>
    ) : null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
      {permissions.map((perm) => (
        <label
          key={perm.id}
          className="flex items-center gap-2 cursor-pointer hover:bg-white/60 rounded px-2 py-1.5"
        >
          <input
            type="checkbox"
            checked={selectedPermissionIds.has(perm.id)}
            onChange={() => onToggle(perm.id)}
            className="w-4 h-4 text-[#008AEC] border-gray-300 rounded focus:ring-[#008AEC]"
          />
          <span className="text-sm text-gray-800">{perm.menu?.name ?? perm.menuCode}</span>
        </label>
      ))}
    </div>
  );
}

export function RoleForm({ roleId }: RoleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!roleId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set());

  const { adminPermissions, dealerPermissions } = useMemo(() => {
    const admin: Permission[] = [];
    const dealer: Permission[] = [];

    for (const perm of permissions) {
      if (DEALER_MENU_CODES.has(perm.menuCode)) {
        dealer.push(perm);
      } else {
        admin.push(perm);
      }
    }

    return { adminPermissions: admin, dealerPermissions: dealer };
  }, [permissions]);

  useEffect(() => {
    const loadPermissions = () =>
      fetch('/api/admin/permissions')
        .then((res) => res.json())
        .then((data) => {
          setPermissions(data.permissions || []);
        });

    if (roleId) {
      Promise.all([
        fetch(`/api/admin/roles/${roleId}`).then((res) => {
          if (!res.ok) throw new Error('Failed to fetch role');
          return res.json();
        }),
        loadPermissions(),
      ])
        .then(([roleData]) => {
          const role = roleData.role;
          if (role) {
            setName(role.name ?? '');
            setDescription(role.description ?? '');
            setSelectedPermissionIds(
              new Set((role.permissionIds as string[]) || [])
            );
            if (Array.isArray(role.activities)) {
              setSelectedActivityIds(new Set(role.activities as string[]));
            }
          } else setError('Role not found');
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load');
          setLoading(false);
        });
    } else {
      loadPermissions().then(() => setLoading(false));
    }
  }, [roleId]);

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleActivity = (id: string) => {
    setSelectedActivityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        permissionIds: Array.from(selectedPermissionIds),
        activities: Array.from(selectedActivityIds),
      };
      const url = roleId ? `/api/admin/roles/${roleId}` : '/api/admin/roles';
      const method = roleId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save role');
      router.push('/admin/roles');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow p-6 text-gray-700"
    >
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
            placeholder="e.g. Editor, Viewer"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
            placeholder="Optional description"
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Menu CMS</h3>
          <p className="text-xs text-gray-500 mb-3">
            Centang menu back-office yang boleh diakses oleh role ini.
          </p>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 max-h-80 overflow-y-auto">
            <PermissionChecklist
              permissions={adminPermissions}
              selectedPermissionIds={selectedPermissionIds}
              onToggle={togglePermission}
              emptyMessage="Tidak ada permission. Jalankan seed."
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Menu Dealer</h3>
          <p className="text-xs text-gray-500 mb-3">
            Centang menu dealer portal yang boleh diakses oleh role ini.
          </p>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 max-h-80 overflow-y-auto">
            <PermissionChecklist
              permissions={dealerPermissions}
              selectedPermissionIds={selectedPermissionIds}
              onToggle={togglePermission}
              emptyMessage="Tidak ada menu dealer. Pastikan dealer-menus.data.json sudah di-seed."
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Activities</h3>
          <p className="text-xs text-gray-500 mb-3">
            Centang aktivitas yang boleh dilakukan oleh role ini.
          </p>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 max-h-80 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {ACTIVITIES.map((activity: Activity) => (
                <label key={activity.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/60 rounded px-2 py-1.5">
                  <input type="checkbox" checked={selectedActivityIds.has(activity.id)} onChange={() => toggleActivity(activity.id)} className="w-4 h-4 text-[#008AEC] border-gray-300 rounded focus:ring-[#008AEC]" />
                  <span className="text-sm text-gray-800">{activity.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <AdminLink
          href="/admin/roles"
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </AdminLink>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-[#1956FF] text-white rounded-lg hover:bg-[#1956FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : roleId ? 'Update Role' : 'Create Role'}
        </button>
      </div>
    </form>
  );
}
