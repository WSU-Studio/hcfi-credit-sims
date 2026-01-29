'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';

type User = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  userRoles: Array<{
    role: {
      name: string;
    };
  }>;
};

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
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
        <h2 className="text-lg font-semibold text-gray-900">Users</h2>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <IconPlus size={20} />
          Add User
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
                Email
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles
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
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {user.email}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {user.userRoles.map((ur) => ur.role.name).join(', ') || 'No roles'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/users/${user.id}/edit`}
                      className="h-5 w-5 flex items-center justify-center"
                    >
                      <IconEdit size={18} className="text-blue-500" />
                    </Link>
                    <button
                      className="h-5 w-5 flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this user?')) {
                          // Handle delete
                        }
                      }}
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


