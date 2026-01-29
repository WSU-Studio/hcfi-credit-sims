'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconEdit, IconPlus } from '@tabler/icons-react';

type Role = {
  id: string;
  name: string;
  description: string | null;
  rolePermissions: Array<{
    permission: {
      menuCode: string;
      canView: boolean;
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
    };
  }>;
};

export function RolesTable() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/roles')
      .then((res) => res.json())
      .then((data) => {
        setRoles(data.roles || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
        <Link
          href="/admin/roles/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <IconPlus size={20} />
          Add Role
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permissions
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {role.name}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {role.description || '-'}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {role.rolePermissions.length} permission(s)
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                  <Link
                    href={`/admin/roles/${role.id}/edit`}
                    className="h-5 w-5 flex items-center justify-center"
                  >
                    <IconEdit size={18} className="text-blue-500" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


