'use client';

import { useEffect, useState } from 'react';
import { AdminLink } from '@/app/components/admin/AdminLink';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';

type Page = {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  showInMenu: boolean;
  menuOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export function PagesTable() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/pages')
      .then((res) => res.json())
      .then((data) => {
        setPages(data.pages || []);
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
      <div className="px-3 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Pages</h2>
        {/* <AdminLink
          href="/admin/pages/new"
          className="inline-flex items-center gap-2 px-4 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <IconPlus size={20} />
          Add Page
        </AdminLink> */}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              {/* <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Menu
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th> */}
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pages.map((page) => (
              <tr key={page.id}>
                <td className="px-3 py-2 text-sm font-medium text-gray-900">
                  <div className="flex flex-col">
                    <span className="text-gray-900">{page.title}</span>
                    <span className="text-gray-500 text-xs font-normal italic">{page.titleEn}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-sm text-gray-500">
                  {page.slug}
                </td>
                {/* <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                  {page.showInMenu ? (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Ya
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                  {page.menuOrder}
                </td> */}
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                  {new Date(page.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <AdminLink
                      href={`/admin/pages/${page.id}/edit`}
                      className="h-8 w-8 flex items-center justify-center cursor-pointer hover:text-[#008AEC]/80 transition-colors bg-blue-50/80 rounded-lg hover:bg-blue-100/80 border border-blue-200/80"
                    >
                      <IconEdit size={18} className="text-blue-500" title="Edit Page" />
                    </AdminLink>
                    <button
                      className="h-8 w-8 flex items-center justify-center cursor-pointer hover:text-red-500/80 transition-colors bg-red-50/80 rounded-lg hover:bg-red-100/80 border border-red-200/80"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this page?')) {
                          fetch(`/api/admin/pages/${page.id}`, {
                            method: 'DELETE',
                          }).then(() => {
                            setPages((prev) => prev.filter((p) => p.id !== page.id));
                          });
                        }
                      }}
                    >
                      <IconTrash size={18} className="text-red-500" title="Delete Page" />
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


