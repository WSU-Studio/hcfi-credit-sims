'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import { CldImage } from 'next-cloudinary';
import Image from 'next/image';

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

export function ArticlesTable() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/articles')
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.articles || []);
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
      <div className="px-3 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1956FF] text-white rounded-lg hover:bg-[#1956FF]/90 transition-colors"
        >
          <IconPlus size={20} />
          Add Article
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
              {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subtitle
              </th> */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Author
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Read
              </th>
              {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Featured
              </th> */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articles.map((article) => (
              <tr key={article.id}>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="w-20 h-12 relative rounded overflow-hidden bg-gray-100">
                    {article.imageUrl ? (
                      article.imageUrl.includes('cloudinary') ? (
                        <CldImage
                          src={article.imageUrl}
                          width={80}
                          height={48}
                          alt={article.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Image
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          width={80}
                          height={48}
                        />
                      )
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center justify-center w-full h-full">
                        No image
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4">
                  <div className="text-xs font-medium text-gray-900">{article.title}</div>
                  {article.excerpt && (
                    <div className="text-xs text-gray-400 truncate max-w-xs mt-0.5">
                      {article.excerpt}
                    </div>
                  )}
                </td>
                {/* <td className="px-3 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                  {article.subtitle || '-'}
                </td> */}
                <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-600">
                  {article.author?.name ?? '-'}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-600">
                  {article.category ?? '-'}
                </td>
                <td className="px-3 py-4 text-xs text-gray-600 max-w-[180px]">
                  {article.tags?.length
                    ? article.tags.slice(0, 3).join(', ') + (article.tags.length > 3 ? '…' : '')
                    : '-'}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-600">
                  {article.readingTime != null ? `${article.readingTime} m` : '-'}
                </td>
                {/* <td className="px-3 py-4 whitespace-nowrap">
                  {article.featured ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-600">
                      Featured
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td> */}
                <td className="px-3 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      article.isPublished
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {article.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-600">
                  {new Date(article.createdAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-xs text-gray-600">
                  {new Date(article.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#008AEC] hover:bg-[#008AEC]/10 hover:text-[#1956FF] transition-colors"
                      title="Edit Article"
                    >
                      <IconEdit size={18} />
                    </Link>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                      title="Delete Article"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this article?')) {
                          fetch(`/api/admin/articles/${article.id}`, {
                            method: 'DELETE',
                          }).then(() => {
                            setArticles((prev) => prev.filter((a) => a.id !== article.id));
                          });
                        }
                      }}
                    >
                      <IconTrash size={18} />
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
