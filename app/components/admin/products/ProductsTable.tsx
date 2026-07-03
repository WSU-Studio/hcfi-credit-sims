'use client';

import { useEffect, useState } from 'react';
import { AdminLink } from '@/app/components/admin/AdminLink';
import { IconEdit, IconTrash, IconPlus, IconLink } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';

const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', { dateStyle: 'medium' });

type Product = {
  id: string;
  title: string;
  titleEn: string | null;
  subtitle: string | null;
  subtitleEn: string | null;
  imageUrl: string;
  order: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
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
        <h2 className="text-lg font-semibold text-gray-900">Products</h2>
        <AdminLink
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1956FF] text-white rounded-lg hover:bg-[#1956FF]/90 transition-colors"
        >
          <IconPlus size={20} />
          Add Product
        </AdminLink>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subtitle
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Featured
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 align-top">
                  {formatDate(product.createdAt)}
                  <span className="text-xs text-gray-500 block">
                    Last updated at {formatDate(product.updatedAt)}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap align-top">
                  <div className="w-20 h-12 relative rounded overflow-hidden">
                    <Image
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        width={80}
                        height={48}
                      />
                  </div>
                </td>
                <td className="px-3 py-2 text-xs font-medium text-gray-900 align-top">
                  <div className="flex flex-col">
                    <span className="text-gray-900">{product.title}</span>
                    <span className="text-gray-500 font-normal italic">{product.titleEn}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500 align-top">
                  <div className="flex flex-col">
                    <span className="text-gray-900">{product.subtitle}</span>
                    <span className="text-gray-500 font-normal italic">{product.subtitleEn}</span>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 align-top">
                  {product.isFeatured ? 'Yes' : 'No'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 align-top">
                  {product.order}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium align-top">
                  <div className="flex items-center gap-2">
                    <AdminLink
                      href={`/admin/products/${product.id}/edit`}
                      className="h-8 w-8 flex items-center justify-center cursor-pointer hover:text-[#008AEC]/80 transition-colors bg-blue-50/80 rounded-lg hover:bg-blue-100/80 border border-blue-200/80"
                      title="Edit Product"
                    >
                      <IconEdit size={18} className="text-blue-500" />
                    </AdminLink>
                    <Link
                      href={`/products/${product.id}`}
                      className="h-8 w-8 flex items-center justify-center cursor-pointer hover:text-[#008AEC]/80 transition-colors bg-blue-50/80 rounded-lg hover:bg-blue-100/80 border border-blue-200/80"
                      title="Preview Product"
                      target="_blank"
                    >
                      <IconLink size={18} className="text-blue-500" />
                    </Link>
                    <button
                      className="h-8 w-8 flex items-center justify-center cursor-pointer hover:text-red-500/80 transition-colors bg-red-50/80 rounded-lg hover:bg-red-100/80 border border-red-200/80"
                      title="Delete Product"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this product?')) {
                          fetch(`/api/admin/products/${product.id}`, {
                            method: 'DELETE',
                          }).then(() => {
                            setProducts((prev) => prev.filter((p) => p.id !== product.id));
                          });
                        }
                      }}
                    >
                      <IconTrash size={18} className="text-red-500" title="Delete Product" />
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


