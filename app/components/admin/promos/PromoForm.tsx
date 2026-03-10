'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLink } from '@/app/components/admin/AdminLink';
import { MediaPicker } from '@/app/components/admin/media/MediaPicker';
import { LayoutBuilderSection } from '@/app/components/admin/LayoutBuilderSection';
import type { PageLayout } from '@/app/types';

const BANNER_RATIO_OPTIONS = [
  { value: 'default', label: 'Default (rasio asli)' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '16:9', label: '16:9' },
  { value: '3:1', label: '3:1 (banner)' },
  { value: '4:1', label: '4:1 (banner)' },
  { value: '5:1', label: '5:1 (banner)' },
] as const;

type Promo = {
  id: string;
  title: string;
  titleEn?: string | null;
  slug: string | null;
  description: string | null;
  descriptionEn?: string | null;
  imageUrl: string | null;
  bannerImageRatio: string | null;
  bannerUseContainer: boolean;
  showBannerImage: boolean;
  content: string | null;
  contentEn?: string | null;
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
  const [bannerImageRatio, setBannerImageRatio] = useState('default');
  const [bannerUseContainer, setBannerUseContainer] = useState(true);
  const [showBannerImage, setShowBannerImage] = useState(true);
  const [titleEn, setTitleEn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [contentEn, setContentEn] = useState('');
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
            setTitleEn(p.titleEn ?? '');
            setDescriptionEn(p.descriptionEn ?? '');
            setImageUrl(p.imageUrl ?? '');
            setContent(p.content ?? '');
            setContentEn(p.contentEn ?? '');
            setIsActive(p.isActive ?? true);
            setIsHighlight(p.isHighlight ?? false);
            setOrder(p.order ?? 0);
            setStartDate(toDateInput(p.startDate));
            setEndDate(toDateInput(p.endDate));
            setBannerImageRatio((p as Promo).bannerImageRatio ?? 'default');
            setBannerUseContainer((p as Promo).bannerUseContainer ?? true);
            setShowBannerImage((p as Promo).showBannerImage ?? true);
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
        titleEn: titleEn.trim() || null,
        slug: slugFinal,
        description: description.trim() || null,
        descriptionEn: descriptionEn.trim() || null,
        imageUrl: imageUrl.trim() || null,
        content: content.trim() || null,
        contentEn: contentEn.trim() || null,
        layout,
        isActive,
        isHighlight,
        order: Number(order) || 0,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        bannerImageRatio: bannerImageRatio || 'default',
        bannerUseContainer,
        showBannerImage,
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

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full pl-9 pr-3 h-10 border border-gray-300 rounded-t-lg focus:bg-blue-100/40 focus:ring-0"
                placeholder="Promo title"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-500">EN</span>
              <input
                type="text"
                id="titleEn"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full pl-9 pr-3 h-10 border border-gray-300 border-t-0 rounded-b-lg focus:bg-blue-100/40"
                placeholder="Promo title (EN)"
              />
            </div>
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
              className="w-full px-3 h-10 border border-gray-300 rounded-lg bg-slate-100/80"
              placeholder="url-friendly-slug"
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">URL: /promo/[slug] (e.g. /promo/cashback-2025)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (short)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-red-500">ID</span>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-9 pr-3 h-10 border border-gray-300 rounded-t-lg focus:bg-blue-100/40 focus:ring-0"
                placeholder="Short description for listing"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-500">EN</span>
              <input
                type="text"
                id="descriptionEn"
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                className="w-full pl-9 pr-3 h-10 border border-gray-300 border-t-0 rounded-b-lg focus:bg-blue-100/40"
                placeholder="Short description for listing (EN)"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 px-3 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
                  placeholder="Image URL"
                />
                <MediaPicker value={imageUrl} onSelect={(m) => setImageUrl(m?.url ?? '')} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rasio gambar cover
                </label>
                <select
                  value={bannerImageRatio}
                  onChange={(e) => setBannerImageRatio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
                >
                  {BANNER_RATIO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Sama seperti widget Text + Image</p>
              </div>
              <div className="flex flex-col gap-2 justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bannerUseContainer}
                    onChange={(e) => setBannerUseContainer(e.target.checked)}
                    className="w-4 h-4 text-[#008AEC] border-gray-300 rounded focus:ring-[#008AEC]"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Gunakan Container
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBannerImage}
                    onChange={(e) => setShowBannerImage(e.target.checked)}
                    className="w-4 h-4 text-[#008AEC] border-gray-300 rounded focus:ring-[#008AEC]"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Tampilkan cover image
                  </span>
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-500 my-0">
              Gunakan Container: tidak dicentang = cover sampai tepi halaman (tanpa rounded). 
            </p>
            <p className="text-xs text-gray-500 my-0">
              Tampilkan cover: tidak dicentang = gambar cover disembunyikan di halaman promo.
            </p>
          </div>

          {imageUrl && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Cover preview"
                className="h-32 max-h-56 w-auto rounded border object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="w-full px-3 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
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
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content (optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm font-bold text-red-500">ID</span>
            <textarea
              id="content"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-t-lg focus:bg-blue-100/40 focus:ring-0"
              placeholder="Plain HTML used when layout is empty"
            />
          </div>
          <div className="relative -mt-1">
            <span className="absolute left-3 top-2.5 text-sm font-bold text-blue-500">EN</span>
            <textarea
              id="contentEn"
              rows={3}
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 border-t-0 rounded-b-lg focus:bg-blue-100/40"
              placeholder="Plain HTML for EN locale"
            />
          </div>
        </div>

        <LayoutBuilderSection layout={layout} setLayout={setLayout} />
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <AdminLink
          href="/admin/promos"
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </AdminLink>
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
