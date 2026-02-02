'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutBuilderSection } from '@/app/components/admin/LayoutBuilderSection';
import type { PageLayout } from '@/app/types';

type StaticPage = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  layout: PageLayout | null;
  showInMenu: boolean;
  menuOrder: number;
};

type PageFormProps = {
  pageId?: string;
};

export function PageForm({ pageId }: PageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!pageId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [showInMenu, setShowInMenu] = useState(false);
  const [menuOrder, setMenuOrder] = useState(0);
  const [layout, setLayout] = useState<PageLayout>({ rows: [] });
  const returnAfterSaveRef = useRef(false);

  useEffect(() => {
    if (pageId) {
      fetch(`/api/admin/pages/${pageId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data.page) {
            const p = data.page as StaticPage;
            setTitle(p.title ?? '');
            setSlug(p.slug ?? '');
            setContent(p.content ?? '');
            setShowInMenu(p.showInMenu ?? false);
            setMenuOrder(p.menuOrder ?? 0);
            const l = p.layout;
            if (l && typeof l === 'object' && 'rows' in l && Array.isArray((l as PageLayout).rows)) {
              setLayout(l as PageLayout);
            } else {
              setLayout({ rows: [] });
            }
          } else setError('Page not found');
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load page');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [pageId]);

  const slugify = (t: string) =>
    t
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!pageId || !slug) setSlug(slugify(v) || slug);
  };

  const savePage = async (redirectAfterSave: boolean) => {
    setError('');
    setSaving(true);
    try {
      const slugFinal = slug.trim() || slugify(title) || `page-${Date.now()}`;
      const payload = {
        title: title.trim(),
        slug: slugFinal,
        content: content.trim() || null,
        showInMenu,
        menuOrder: Number(menuOrder) || 0,
        layout,
      };
      const url = pageId ? `/api/admin/pages/${pageId}` : '/api/admin/pages';
      const method = pageId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save page');
      if (redirectAfterSave) {
        router.push('/admin/pages');
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
    if (pageId) {
      const shouldReturn = returnAfterSaveRef.current;
      returnAfterSaveRef.current = false;
      savePage(shouldReturn);
    } else {
      savePage(true);
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
            placeholder="Page title"
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
          <p className="mt-1 text-xs text-gray-500">URL: /[slug] (e.g. /informasi, /privacy-policy)</p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInMenu}
              onChange={(e) => setShowInMenu(e.target.checked)}
              className="w-4 h-4 text-[#008AEC] border-gray-300 rounded focus:ring-[#008AEC]"
            />
            <span className="text-sm font-medium text-gray-700">Tampilkan di menu</span>
          </label>
          <div className="flex items-center gap-2">
            <label htmlFor="menuOrder" className="text-sm font-medium text-gray-700">
              Urutan menu
            </label>
            <input
              type="number"
              id="menuOrder"
              min={0}
              value={menuOrder}
              onChange={(e) => setMenuOrder(Number(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm"
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
          href="/admin/pages"
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        {pageId ? (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => savePage(false)}
              className="px-4 py-2 border border-[#1956FF] text-[#1956FF] rounded-lg hover:bg-[#1956FF]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Update Page'}
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
            {saving ? 'Saving...' : 'Create Page'}
          </button>
        )}
      </div>
    </form>
  );
}
