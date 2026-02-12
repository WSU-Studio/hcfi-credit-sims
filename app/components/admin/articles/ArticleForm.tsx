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

type Article = {
  id: string;
  title: string;
  titleEn?: string | null;
  slug: string;
  subtitle: string | null;
  subtitleEn?: string | null;
  excerpt: string | null;
  excerptEn?: string | null;
  content: string;
  contentEn?: string | null;
  layout: PageLayout | null;
  imageUrl: string | null;
  bannerImageRatio: string | null;
  bannerUseContainer: boolean;
  showBannerImage: boolean;
  metaDescription: string | null;
  metaDescriptionEn?: string | null;
  category: string | null;
  tags: string[];
  readingTime: number | null;
  featured: boolean;
  authorId: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string; email: string } | null;
};

type ArticleFormProps = {
  articleId?: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function ArticleForm({ articleId }: ArticleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!articleId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [layout, setLayout] = useState<PageLayout>({ rows: [] });
  const returnAfterSaveRef = useRef(false);
  const [formData, setFormData] = useState<Partial<Article> & { tagsInput?: string }>({
    title: '',
    titleEn: '',
    slug: '',
    subtitle: '',
    subtitleEn: '',
    excerpt: '',
    excerptEn: '',
    content: '',
    contentEn: '',
    imageUrl: '',
    metaDescription: '',
    metaDescriptionEn: '',
    category: '',
    tagsInput: '',
    readingTime: undefined,
    featured: false,
    isPublished: false,
    bannerImageRatio: 'default',
    bannerUseContainer: true,
    showBannerImage: true,
  });

  useEffect(() => {
    if (articleId) {
      fetch(`/api/admin/articles/${articleId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data.article) {
            const a = data.article;
            setFormData({
              title: a.title ?? '',
              titleEn: a.titleEn ?? '',
              slug: a.slug ?? '',
              subtitle: a.subtitle ?? '',
              subtitleEn: a.subtitleEn ?? '',
              excerpt: a.excerpt ?? '',
              excerptEn: a.excerptEn ?? '',
              content: a.content ?? '',
              contentEn: a.contentEn ?? '',
              imageUrl: a.imageUrl ?? '',
              metaDescription: a.metaDescription ?? '',
              metaDescriptionEn: a.metaDescriptionEn ?? '',
              category: a.category ?? '',
              tagsInput: Array.isArray(a.tags) ? a.tags.join(', ') : '',
              readingTime: a.readingTime ?? undefined,
              featured: a.featured ?? false,
              isPublished: a.isPublished ?? false,
              bannerImageRatio: a.bannerImageRatio ?? 'default',
              bannerUseContainer: a.bannerUseContainer ?? true,
              showBannerImage: a.showBannerImage ?? true,
            });
            const l = a.layout;
            if (l && typeof l === 'object' && 'rows' in l && Array.isArray((l as PageLayout).rows)) {
              setLayout(l as PageLayout);
            } else {
              setLayout({ rows: [] });
            }
          } else setError('Article not found');
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load article');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [articleId]);

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug === slugify(prev.title || '') || !prev.slug ? slugify(title) : prev.slug,
    }));
  };

  const saveArticle = async (redirectAfterSave: boolean) => {
    setError('');
    setSaving(true);
    try {
      const slug =
        formData.slug?.trim() || (formData.title ? slugify(formData.title) : `article-${Date.now()}`);
      const tags = (formData.tagsInput ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const { tagsInput: _ti, ...restForm } = formData;
      const payload = {
        ...restForm,
        slug,
        subtitle: formData.subtitle || null,
        subtitleEn: formData.subtitleEn || null,
        excerpt: formData.excerpt || null,
        excerptEn: formData.excerptEn || null,
        content: (formData.content ?? '').trim() || '',
        contentEn: formData.contentEn?.trim() || null,
        imageUrl: formData.imageUrl || null,
        metaDescription: formData.metaDescription || null,
        metaDescriptionEn: formData.metaDescriptionEn || null,
        titleEn: formData.titleEn || null,
        category: formData.category || null,
        tags,
        readingTime:
          formData.readingTime != null ? Number(formData.readingTime) : null,
        featured: Boolean(formData.featured),
        layout,
        bannerImageRatio: (formData.bannerImageRatio as string) || 'default',
        bannerUseContainer: Boolean(formData.bannerUseContainer),
        showBannerImage: formData.showBannerImage !== false,
      };

      const url = articleId ? `/api/admin/articles/${articleId}` : '/api/admin/articles';
      const method = articleId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save article');

      if (redirectAfterSave) {
        router.push('/admin/articles');
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
    if (articleId) {
      const shouldReturn = returnAfterSaveRef.current;
      returnAfterSaveRef.current = false;
      saveArticle(shouldReturn);
    } else {
      saveArticle(true);
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
                value={formData.title ?? ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full pl-9 pr-3 h-10 border border-gray-300 rounded-t-lg focus:bg-blue-100/40 focus:ring-0"
                placeholder="Judul artikel"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-500">EN</span>
              <input
                type="text"
                id="titleEn"
                value={formData.titleEn ?? ''}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                className="w-full pl-9 pr-3 h-10 border border-gray-300 border-t-0 rounded-b-lg focus:bg-blue-100/40"
                placeholder="Article title (EN)"
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
              value={formData.slug ?? ''}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 h-10 border border-gray-300 rounded-lg bg-slate-100/80"
              placeholder="url-friendly-slug"
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">URL: /articles/[slug] (e.g. /articles/tips-belanja-online)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-red-500">ID</span>
              <input
                type="text"
                id="subtitle"
                value={formData.subtitle ?? ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full pl-9 pr-3 h-10 border border-gray-300 rounded-t-lg focus:bg-blue-100/40 focus:ring-0"
                placeholder="Subjudul (opsional)"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-500">EN</span>
              <input
                type="text"
                id="subtitleEn"
                value={formData.subtitleEn ?? ''}
                onChange={(e) => setFormData({ ...formData, subtitleEn: e.target.value })}
                className="w-full pl-9 pr-3 h-10 border border-gray-300 border-t-0 rounded-b-lg focus:bg-blue-100/40"
                placeholder="Subtitle (EN)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                id="category"
                value={formData.category ?? ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
                placeholder="e.g. Tips, Promo, Berita"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banner Image
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.imageUrl ?? ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="flex-1 px-3 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
                  placeholder="URL gambar atau pilih dari media"
                />
                <MediaPicker
                  onSelect={(media) =>
                    setFormData({ ...formData, imageUrl: media?.url ?? '' })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rasio gambar banner
                </label>
                <select
                  value={formData.bannerImageRatio ?? 'default'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bannerImageRatio: e.target.value as (typeof BANNER_RATIO_OPTIONS)[number]['value'],
                    })
                  }
                  className="w-full px-3 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
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
                    checked={formData.bannerUseContainer ?? true}
                    onChange={(e) =>
                      setFormData({ ...formData, bannerUseContainer: e.target.checked })
                    }
                    className="w-4 h-4 text-[#008AEC] border-gray-300 rounded focus:ring-[#008AEC]"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Gunakan Container
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showBannerImage ?? true}
                    onChange={(e) =>
                      setFormData({ ...formData, showBannerImage: e.target.checked })
                    }
                    className="w-4 h-4 text-[#008AEC] border-gray-300 rounded focus:ring-[#008AEC]"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Tampilkan banner image
                  </span>
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-500 my-0">
              Gunakan Container: tidak dicentang = banner sampai tepi halaman (tanpa rounded). 
            </p>
            <p className="text-xs text-gray-500 my-0">
              Tampilkan banner: tidak dicentang = gambar banner disembunyikan di halaman artikel.
            </p>
          </div>

          {formData.imageUrl && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.imageUrl}
                alt="Banner preview"
                className="h-32 max-h-56 w-auto rounded border object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
            Excerpt (ringkasan)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm font-bold text-red-500">ID</span>
            <textarea
              id="excerpt"
              rows={2}
              value={formData.excerpt ?? ''}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-t-lg focus:bg-blue-100/40 focus:ring-0"
              placeholder="Ringkasan singkat untuk list/card"
            />
          </div>
          <div className="relative -mt-1">
            <span className="absolute left-3 top-2.5 text-sm font-bold text-blue-500">EN</span>
            <textarea
              id="excerptEn"
              rows={2}
              value={formData.excerptEn ?? ''}
              onChange={(e) => setFormData({ ...formData, excerptEn: e.target.value })}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 border-t-0 rounded-b-lg focus:bg-blue-100/40"
              placeholder="Short excerpt (EN)"
            />
          </div>
        </div>

        <div>
          <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm font-bold text-red-500">ID</span>
            <textarea
              id="metaDescription"
              rows={2}
              value={formData.metaDescription ?? ''}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-t-lg focus:bg-blue-100/40 focus:ring-0"
              placeholder="Deskripsi untuk search engine (max ~160 karakter)"
            />
          </div>
          <div className="relative -mt-1">
            <span className="absolute left-3 top-2.5 text-sm font-bold text-blue-500">EN</span>
            <textarea
              id="metaDescriptionEn"
              rows={2}
              value={formData.metaDescriptionEn ?? ''}
              onChange={(e) => setFormData({ ...formData, metaDescriptionEn: e.target.value })}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 border-t-0 rounded-b-lg focus:bg-blue-100/40"
              placeholder="Meta description for search (EN)"
            />
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
              rows={4}
              value={formData.content ?? ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-t-lg focus:bg-blue-100/40 focus:ring-0 text-sm"
              placeholder="Plain HTML used when layout is empty"
            />
          </div>
          <div className="relative -mt-1">
            <span className="absolute left-3 top-2.5 text-sm font-bold text-blue-500">EN</span>
            <textarea
              id="contentEn"
              rows={4}
              value={formData.contentEn ?? ''}
              onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 border-t-0 rounded-b-lg focus:bg-blue-100/40 text-sm"
              placeholder="Plain HTML for EN locale"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Digunakan jika layout kosong</p>
        </div>

        <LayoutBuilderSection layout={layout} setLayout={setLayout} />

        <hr className="my-6 border-gray-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tagsInput" className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                id="tagsInput"
                value={formData.tagsInput ?? ''}
                onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
                placeholder="tag1, tag2, tag3 (pisah dengan koma)"
              />
            </div>
            <div>
              <label htmlFor="readingTime" className="block text-sm font-medium text-gray-700 mb-1">
                Reading Time (menit)
              </label>
              <input
                type="number"
                id="readingTime"
                min={1}
                value={formData.readingTime ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    readingTime: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
                placeholder="Estimasi menit baca"
              />
              <p className="mt-1 text-xs text-gray-500">Estimasi waktu baca artikel</p>
            </div>
          </div>

          <div className="flex flex-col items-end justify-end">
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished ?? false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isPublished: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#008AEC] border-gray-300 rounded focus:ring-[#008AEC]"
                />
                <span className="text-sm font-medium text-gray-700">Published</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured ?? false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      featured: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#008AEC] border-gray-300 rounded focus:ring-[#008AEC]"
                />
                <span className="text-sm font-medium text-gray-700">Featured</span>
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Published: tampil di frontend. Featured: tampil di highlight/homepage.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <AdminLink
          href="/admin/articles"
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </AdminLink>
        {articleId ? (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => saveArticle(false)}
              className="px-4 py-2 border border-[#1956FF] text-[#1956FF] rounded-lg hover:bg-[#1956FF]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Update Article'}
            </button>
            <button
              type="submit"
              disabled={saving}
              onClick={() => { returnAfterSaveRef.current = true; }}
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
            {saving ? 'Saving...' : 'Create Article'}
          </button>
        )}
      </div>
    </form>
  );
}
