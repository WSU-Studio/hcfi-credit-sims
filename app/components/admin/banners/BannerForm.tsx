'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MediaPicker } from '@/app/components/admin/media/MediaPicker';

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
};

type BannerFormProps = {
  bannerId?: string;
};

export function BannerForm({ bannerId }: BannerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!bannerId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<Banner>>({
    title: '',
    highlight: '',
    description: '',
    imageUrl: '',
    ctaLabel: '',
    ctaUrl: '',
    isActive: true,
    order: 0,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (bannerId) {
      fetch(`/api/admin/banners/${bannerId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.banner) {
            const banner = data.banner;
            // Parse dates safely - handle both string and Date objects
            let startDate = '';
            let endDate = '';
            
            if (banner.startDate) {
              try {
                const date = typeof banner.startDate === 'string' 
                  ? new Date(banner.startDate) 
                  : banner.startDate;
                if (!isNaN(date.getTime())) {
                  startDate = date.toISOString().slice(0, 16);
                }
              } catch {
                // Invalid date, leave empty
              }
            }
            
            if (banner.endDate) {
              try {
                const date = typeof banner.endDate === 'string' 
                  ? new Date(banner.endDate) 
                  : banner.endDate;
                if (!isNaN(date.getTime())) {
                  endDate = date.toISOString().slice(0, 16);
                }
              } catch {
                // Invalid date, leave empty
              }
            }
            
            setFormData({
              title: banner.title || '',
              highlight: banner.highlight || '',
              description: banner.description || '',
              imageUrl: banner.imageUrl || '',
              ctaLabel: banner.ctaLabel || '',
              ctaUrl: banner.ctaUrl || '',
              isActive: banner.isActive ?? true,
              order: banner.order ?? 0,
              startDate,
              endDate,
            });
          } else {
            setError('Banner not found');
          }
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load banner');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [bannerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Safely parse dates
      let startDate: string | null = null;
      let endDate: string | null = null;
      
      if (formData.startDate) {
        try {
          const date = new Date(formData.startDate);
          if (!isNaN(date.getTime())) {
            startDate = date.toISOString();
          }
        } catch {
          // Invalid date, leave as null
        }
      }
      
      if (formData.endDate) {
        try {
          const date = new Date(formData.endDate);
          if (!isNaN(date.getTime())) {
            endDate = date.toISOString();
          }
        } catch {
          // Invalid date, leave as null
        }
      }
      
      const payload = {
        ...formData,
        startDate,
        endDate,
        order: Number(formData.order) || 0,
      };

      const url = bannerId
        ? `/api/admin/banners/${bannerId}`
        : '/api/admin/banners';
      const method = bannerId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save banner');
      }

      router.push('/admin/banners');
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

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Dapatkan Benefit Kredit Mobil Baru Anda di"
          />
        </div>

        {/* Highlight */}
        <div>
          <label htmlFor="highlight" className="block text-sm font-medium text-gray-700 mb-1">
            Highlight (Accent Text)
          </label>
          <input
            type="text"
            id="highlight"
            value={formData.highlight || ''}
            onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Hyundai Finance"
          />
          <p className="mt-1 text-xs text-gray-500">
            Text yang akan ditampilkan dengan warna accent
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Rasakan kemudahan proses kredit dengan layanan profesional..."
          />
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="/images/banner.jpg or Cloudinary URL"
            />
            <MediaPicker
              onSelect={(media) => setFormData({ ...formData, imageUrl: media?.url || '' })}
            />
          </div>
          {formData.imageUrl && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="h-32 w-auto rounded border border-gray-300 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* CTA Label & URL */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ctaLabel" className="block text-sm font-medium text-gray-700 mb-1">
              CTA Label
            </label>
            <input
              type="text"
              id="ctaLabel"
              value={formData.ctaLabel || ''}
              onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Mulai Simulasi"
            />
          </div>
          <div>
            <label htmlFor="ctaUrl" className="block text-sm font-medium text-gray-700 mb-1">
              CTA URL
            </label>
            <input
              type="text"
              id="ctaUrl"
              value={formData.ctaUrl || ''}
              onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://... (kosongkan jika tidak ada)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Kosongkan atau isi dengan URL lengkap. Jika tidak ada, biarkan kosong.
            </p>
          </div>
        </div>

        {/* Order & Status */}
        <div className="grid grid-cols-2 gap-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Urutan tampil (angka lebih kecil = tampil lebih dulu)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Hanya banner aktif yang ditampilkan
            </p>
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date (Optional)
            </label>
            <input
              type="datetime-local"
              id="startDate"
              value={formData.startDate || ''}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date (Optional)
            </label>
            <input
              type="datetime-local"
              id="endDate"
              value={formData.endDate || ''}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Jika diisi, banner hanya akan ditampilkan dalam rentang waktu tersebut
        </p>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <Link
          href="/admin/banners"
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : bannerId ? 'Update Banner' : 'Create Banner'}
        </button>
      </div>
    </form>
  );
}

