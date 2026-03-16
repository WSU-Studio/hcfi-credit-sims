'use client';

import { useEffect, useState } from 'react';
import { AdminLink } from '@/app/components/admin/AdminLink';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import Image from 'next/image';

const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', { dateStyle: 'medium' });

type Banner = {
  id: string;
  title: string;
  highlight: string | null;
  description: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  isActive: boolean;
  order: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
};

export function BannersTable() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/admin/banners')
      .then((res) => res.json())
      .then((data) => {
        setBanners(data.banners || []);
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
        <h2 className="text-lg font-semibold text-gray-900">Banners</h2>
        <AdminLink
          href="/admin/banners/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <IconPlus size={20} />
          Add Banner
        </AdminLink>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
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
            {banners.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No banners found. Create your first banner to get started.
                </td>
              </tr>
            ) : (
              banners.map((banner) => (
                <tr key={banner.id}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(banner.createdAt)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                  <div className="w-20 h-12 relative rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                    {imageErrors.has(banner.id) ? (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        No image
                      </div>
                    ) : banner.imageUrl.startsWith('http') ? (
                      // Use regular img for external URLs to avoid Next.js Image restrictions
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                        onError={() => {
                          setImageErrors((prev) => new Set(prev).add(banner.id));
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                        width={80}
                        height={48}
                        onError={() => {
                          setImageErrors((prev) => new Set(prev).add(banner.id));
                        }}
                      />
                    )}
                  </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm font-medium text-gray-900">{banner.title}</div>
                    {banner.highlight && (
                      <div className="text-sm text-gray-500">{banner.highlight}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        banner.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {banner.order}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <AdminLink
                        href={`/admin/banners/${banner.id}/edit`}
                        className="h-8 w-8 flex items-center justify-center cursor-pointer hover:text-[#008AEC]/80 transition-colors bg-blue-50/80 rounded-lg hover:bg-blue-100/80 border border-blue-200/80"
                        title="Edit Banner"
                      >
                        <IconEdit size={18} className="text-blue-500" />
                      </AdminLink>
                      <button
                        className="h-8 w-8 flex items-center justify-center cursor-pointer hover:text-red-500/80 transition-colors bg-red-50/80 rounded-lg hover:bg-red-100/80 border border-red-200/80"
                        title="Delete Banner"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this banner?')) {
                            fetch(`/api/admin/banners/${banner.id}`, {
                              method: 'DELETE',
                            }).then(() => {
                              setBanners((prev) => prev.filter((b) => b.id !== banner.id));
                            });
                          }
                        }}
                      >
                        <IconTrash size={18} className="text-red-500" title="Delete Banner" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


