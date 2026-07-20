'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLink } from '@/app/components/admin/AdminLink';
import { MediaPicker } from '@/app/components/admin/media/MediaPicker';
import { LayoutBuilderSection } from '@/app/components/admin/LayoutBuilderSection';
import type { PageLayout } from '@/app/types';
import { formatAdminApiError } from '@/lib/security/format-admin-api-error';

type Product = {
  id: string;
  title: string;
  titleEn?: string | null;
  subtitle: string | null;
  subtitleEn?: string | null;
  imageUrl: string;
  content: string | null;
  contentEn?: string | null;
  layout: PageLayout | null;
  order: number;
  isFeatured: boolean;
};

type ProductFormProps = {
  productId?: string;
};

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<Product>>({
    title: '',
    titleEn: '',
    subtitle: '',
    subtitleEn: '',
    imageUrl: '',
    content: '',
    contentEn: '',
    layout: { rows: [] },
    order: 0,
    isFeatured: false,
  });

  useEffect(() => {
    if (productId) {
      fetch(`/api/admin/products/${productId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.product) {
            const product = data.product;
            const layout = product.layout;
            const parsedLayout: PageLayout =
              layout && typeof layout === 'object' && 'rows' in layout && Array.isArray((layout as PageLayout).rows)
                ? (layout as PageLayout)
                : { rows: [] };
            setFormData({
              title: product.title || '',
              titleEn: (product as Product).titleEn ?? '',
              subtitle: product.subtitle || '',
              subtitleEn: (product as Product).subtitleEn ?? '',
              imageUrl: product.imageUrl || '',
              content: (product as Product).content ?? '',
              contentEn: (product as Product).contentEn ?? '',
              layout: parsedLayout,
              order: product.order ?? 0,
              isFeatured: (product as Product).isFeatured ?? false,
            });
          } else {
            setError('Product not found');
          }
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load product');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...formData,
        order: Number(formData.order) || 0,
        subtitle: formData.subtitle || null,
        subtitleEn: (formData as Product).subtitleEn || null,
        content: formData.content || null,
        contentEn: (formData as Product).contentEn || null,
        layout: formData.layout ?? null,
        isFeatured: formData.isFeatured ?? false,
      };

      const url = productId
        ? `/api/admin/products/${productId}`
        : '/api/admin/products';
      const method = productId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(formatAdminApiError(data, 'Failed to save product'));
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error(errorMessage);
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 text-gray-700">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-red-500">ID</span>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full pl-9 pr-3 h-10 border border-gray-300 rounded-t-lg focus:bg-blue-100/40 focus:ring-0"
                placeholder="e.g., Smart Installment Program"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-500">EN</span>
              <input
                type="text"
                id="titleEn"
                value={(formData as Product).titleEn ?? ''}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                className="w-full pl-9 pr-3 h-10 border border-gray-300 border-t-0 rounded-b-lg focus:bg-blue-100/40"
                placeholder="e.g., Smart Installment Program"
              />
            </div>
          </div>

          {/* Subtitle */}
          <div>
            <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-red-500">ID</span>
              <input
                type="text"
                id="subtitle"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full pl-9 pr-3 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f]"
                placeholder="e.g., Stargazer & Creta (ID)"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-500">EN</span>
              <input
                type="text"
                id="subtitleEn"
                value={(formData as Product).subtitleEn ?? ''}
                onChange={(e) => setFormData({ ...formData, subtitleEn: e.target.value })}
                className="w-full pl-9 pr-3 h-10 border border-gray-300 border-t-0 rounded-b-lg focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f]"
                placeholder="e.g., Stargazer & Creta (EN)"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Subtitle yang akan ditampilkan di bawah title pada product card
            </p>
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Image URL <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="imageUrl"
                required
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="flex-1 px-3 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f]"
                placeholder="/images/product.jpg or S3/URL"
              />
              <MediaPicker
                value={formData.imageUrl}
                onSelect={(media) => setFormData({ ...formData, imageUrl: media?.url || '' })}
              />
            </div>
          </div>

          {/* Order */}
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <input
              type="number"
              id="order"
              min="0"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 0 })}
              className="w-full px-3 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f]"
            />
            <p className="mt-1 text-xs text-gray-500">
              Urutan tampil (angka lebih kecil = tampil lebih dulu)
            </p>
          </div>

          {/* Featured on home */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={formData.isFeatured ?? false}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-4 h-4 text-[#002c5f] border-gray-300 rounded focus:ring-[#002c5f]"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700 cursor-pointer">
              Tampilkan di halaman beranda (home)
            </label>
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            Jika dicentang, produk ini akan muncul di section produk pada halaman beranda. Semua produk tetap tampil di halaman &quot;Semua Produk&quot;.
          </p>
        </div>

        {formData.imageUrl && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={formData.imageUrl}
              alt="Preview"
              className="h-32 max-h-80 w-auto rounded border border-gray-300 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

        <div className="mt-6">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content (opsional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm font-bold text-red-500">ID</span>
            <textarea
              id="content"
              rows={3}
              value={formData.content ?? ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-t-lg focus:bg-blue-100/40 focus:ring-0"
              placeholder="Plain HTML digunakan jika layout kosong"
            />
          </div>
          <div className="relative -mt-1">
            <span className="absolute left-3 top-2.5 text-sm font-bold text-blue-500">EN</span>
            <textarea
              id="contentEn"
              rows={3}
              value={(formData as Product).contentEn ?? ''}
              onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 border-t-0 rounded-b-lg focus:bg-blue-100/40"
              placeholder="Plain HTML for EN locale"
            />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Layout (widget)</h3>
          <LayoutBuilderSection
            layout={formData.layout ?? { rows: [] }}
            setLayout={(l) => {
              const next = typeof l === 'function' ? l(formData.layout ?? { rows: [] }) : l;
              setFormData((prev) => ({ ...prev, layout: next }));
            }}
          />
        </div>

      <hr className="my-4 border-gray-200" />

      {/* Actions */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <AdminLink
          href="/admin/products"
          className="px-4 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </AdminLink>
        <button
          type="submit"
          disabled={saving}
          className="px-4 h-10 flex items-center justify-center bg-[#1956FF] text-white rounded-lg hover:bg-[#1956FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {saving ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
