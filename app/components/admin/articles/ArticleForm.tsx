'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MediaPicker } from '@/app/components/admin/media/MediaPicker';

type Article = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string;
  imageUrl: string | null;
  metaDescription: string | null;
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
  const [formData, setFormData] = useState<Partial<Article> & { tagsInput?: string }>({
    title: '',
    slug: '',
    subtitle: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    metaDescription: '',
    category: '',
    tagsInput: '',
    readingTime: undefined,
    featured: false,
    isPublished: false,
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
              slug: a.slug ?? '',
              subtitle: a.subtitle ?? '',
              excerpt: a.excerpt ?? '',
              content: a.content ?? '',
              imageUrl: a.imageUrl ?? '',
              metaDescription: a.metaDescription ?? '',
              category: a.category ?? '',
              tagsInput: Array.isArray(a.tags) ? a.tags.join(', ') : '',
              readingTime: a.readingTime ?? undefined,
              featured: a.featured ?? false,
              isPublished: a.isPublished ?? false,
            });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        excerpt: formData.excerpt || null,
        imageUrl: formData.imageUrl || null,
        metaDescription: formData.metaDescription || null,
        category: formData.category || null,
        tags,
        readingTime:
          formData.readingTime !== undefined && formData.readingTime !== ''
            ? Number(formData.readingTime)
            : null,
        featured: Boolean(formData.featured),
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

      router.push('/admin/articles');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title ?? ''}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
            placeholder="Judul artikel"
          />
        </div>

        <div>
          <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
            Subtitle
          </label>
          <input
            type="text"
            id="subtitle"
            value={formData.subtitle ?? ''}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
            placeholder="Subjudul (opsional)"
          />
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
            placeholder="url-friendly-slug"
          />
          <p className="mt-1 text-xs text-gray-500">Kosongkan untuk auto-generate dari title</p>
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
            Excerpt (ringkasan)
          </label>
          <textarea
            id="excerpt"
            rows={2}
            value={formData.excerpt ?? ''}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
            placeholder="Ringkasan singkat untuk list/card"
          />
        </div>

        <div>
          <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description (SEO)
          </label>
          <textarea
            id="metaDescription"
            rows={2}
            value={formData.metaDescription ?? ''}
            onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
            placeholder="Deskripsi untuk search engine (max ~160 karakter)"
          />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
              placeholder="e.g. Tips, Promo, Berita"
            />
          </div>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            required
            rows={12}
            value={formData.content ?? ''}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC] font-mono text-sm"
            placeholder="Isi artikel (bisa HTML atau plain text)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Banner Image
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.imageUrl ?? ''}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
              placeholder="URL gambar atau pilih dari media"
            />
            <MediaPicker
              onSelect={(media) =>
                setFormData({ ...formData, imageUrl: media?.url ?? '' })
              }
            />
          </div>
          {formData.imageUrl && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.imageUrl}
                alt="Banner preview"
                className="h-32 w-auto rounded border object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

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

      <div className="mt-6 flex items-center justify-end gap-3">
        <Link
          href="/admin/articles"
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-[#1956FF] text-white rounded-lg hover:bg-[#1956FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : articleId ? 'Update Article' : 'Create Article'}
        </button>
      </div>
    </form>
  );
}
