'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import { CldImage } from 'next-cloudinary';
import Image from 'next/image';

type Product = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  order: number;
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
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1956FF] text-white rounded-lg hover:bg-[#1956FF]/90 transition-colors"
        >
          <IconPlus size={20} />
          Add Product
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="w-20 h-12 relative rounded overflow-hidden">
                    {product.imageUrl.includes('cloudinary') ? (
                      <CldImage
                        src={product.imageUrl}
                        width={80}
                        height={48}
                        alt={product.title}
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        width={80}
                        height={48}
                      />
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs font-medium text-gray-900">
                  {product.title}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {product.subtitle || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {product.order}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="h-5 w-5 flex items-center justify-center"
                      title="Edit Product"
                    >
                      <IconEdit size={18} className="text-blue-500" />
                    </Link>
                    <button
                      className="h-5 w-5 flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this product?')) {
                          fetch(`/api/admin/products/${product.id}`, {
                            method: 'DELETE',
                          }).then(() => {
                            setProducts((prev) => prev.filter((p) => p.id !== product.id));
                          });
                        }
                      }}
                      title="Delete Product"
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


