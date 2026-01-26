'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';

type Promo = {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  isHighlight: boolean;
  order: number;
};

export function PromosTable() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/promos')
      .then((res) => res.json())
      .then((data) => {
        setPromos(data.promos || []);
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
        <h2 className="text-lg font-semibold text-gray-900">Promos</h2>
        <Link
          href="/admin/promos/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <IconPlus size={20} />
          Add Promo
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Highlight
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {promos.map((promo) => (
              <tr key={promo.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{promo.title}</div>
                  {promo.description && (
                    <div className="text-sm text-gray-500 truncate max-w-md">
                      {promo.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      promo.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {promo.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {promo.isHighlight && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Highlight
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {promo.order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/promos/${promo.id}/edit`}
                      className="h-5 w-5 flex items-center justify-center"
                    >
                      <IconEdit size={18} className="text-blue-500" />
                    </Link>
                    <button
                      className="h-5 w-5 flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this promo?')) {
                          fetch(`/api/admin/promos/${promo.id}`, {
                            method: 'DELETE',
                          }).then(() => {
                            setPromos((prev) => prev.filter((p) => p.id !== promo.id));
                          });
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


