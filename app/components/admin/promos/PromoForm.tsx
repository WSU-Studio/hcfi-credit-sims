'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MediaPicker } from '@/app/components/admin/media/MediaPicker';
import { LayoutBuilderSection } from '@/app/components/admin/LayoutBuilderSection';
import type { PageLayout } from '@/app/types';

type Promo = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  content: string | null;
  layout: PageLayout | null;
  isActive: boolean;
  isHighlight: boolean;
  order: number;
  startDate: string | null;
  endDate: string | null;
};

type PromoFormProps = {
  promoId?: string;
};

function slugify(t: string): string {
  return t
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

export function PromoForm({ promoId }: PromoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!promoId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [content, setContent] = useState('');
  const [layout, setLayout] = useState<PageLayout>({ rows: [] });
  const [isActive, setIsActive] = useState(true);
  const [isHighlight, setIsHighlight] = useState(false);
  const [order, setOrder] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const returnAfterSaveRef = useRef(false);

  useEffect(() => {
    if (promoId) {
      fetch(`/api/admin/promos/${promoId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data.promo) {
            const p = data.promo as Promo;
            setTitle(p.title ?? '');
            setSlug(p.slug ?? '');
            setDescription(p.description ?? '');
            setImageUrl(p.imageUrl ?? '');
            setContent(p.content ?? '');
            setIsActive(p.isActive ?? true);
            setIsHighlight(p.isHighlight ?? false);
            setOrder(p.order ?? 0);
            setStartDate(toDateInput(p.startDate));
            setEndDate(toDateInput(p.endDate));
            const l = p.layout;
            if (l && typeof l === 'object' && 'rows' in l && Array.isArray((l as PageLayout).rows)) {
              setLayout(l as PageLayout);
            } else {
              setLayout({ rows: [] });
            }
          } else setError('Promo not found');
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load promo');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [promoId]);

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!promoId || !slug) setSlug(slugify(v) || slug);
  };

  const savePromo = async (redirectAfterSave: boolean) => {
    setError('');
    setSaving(true);
    try {
      const slugFinal = slug.trim() || slugify(title) || `promo-${Date.now()}`;
      const payload = {
        title: title.trim(),
        slug: slugFinal,
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        content: content.trim() || null,
        layout,
        isActive,
        isHighlight,
        order: Number(order) || 0,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
      };
      const url = promoId ? `/api/admin/promos/${promoId}` : '/api/admin/promos';
      const method = promoId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save promo');
      if (redirectAfterSave) {
        router.push('/admin/promos');
        router.refresh();
      } else {
        setSaving(false);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoId) {
      const shouldReturn = returnAfterSaveRef.current;
      returnAfterSaveRef.current = false;
      savePromo(shouldReturn);
    } else {
      savePromo(true);
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
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
            placeholder="Promo title"
          />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug (URL)
          </label>
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
            placeholder="url-friendly-slug"
          />
          <p className="mt-1 text-xs text-gray-500">URL: /promo/[slug] (e.g. /promo/cashback-2025)</p>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (short)
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
            placeholder="Short description for listing"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cover image URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
              placeholder="Image URL"
            />
            <MediaPicker onSelect={(m) => setImageUrl(m?.url ?? '')} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-[#008AEC] border-gray-300 rounded focus:ring-[#008AEC]"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isHighlight}
              onChange={(e) => setIsHighlight(e.target.checked)}
              className="w-4 h-4 text-[#008AEC] border-gray-300 rounded focus:ring-[#008AEC]"
            />
            <span className="text-sm font-medium text-gray-700">Highlight</span>
          </label>
          <div className="flex items-center gap-2">
            <label htmlFor="order" className="text-sm font-medium text-gray-700">
              Order
            </label>
            <input
              type="number"
              id="order"
              min={0}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start date
            </label>
            <input
              type="datetime-local"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End date
            </label>
            <input
              type="datetime-local"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
            />
          </div>
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Fallback content (optional)
          </label>
          <textarea
            id="content"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
            placeholder="Plain HTML used when layout is empty"
          />
        </div>

        <LayoutBuilderSection layout={layout} setLayout={setLayout} />
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <Link
          href="/admin/promos"
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        {promoId ? (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => savePromo(false)}
              className="px-4 py-2 border border-[#1956FF] text-[#1956FF] rounded-lg hover:bg-[#1956FF]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Update Promo'}
            </button>
            <button
              type="submit"
              disabled={saving}
              onClick={() => {
                returnAfterSaveRef.current = true;
              }}
              className="px-4 py-2 bg-[#1956FF] text-white rounded-lg hover:bg-[#1956FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Update and Return'}
            </button>
          </>
        ) : (
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#1956FF] text-white rounded-lg hover:bg-[#1956FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Create Promo'}
          </button>
        )}
      </div>
    </form>
  );
}
