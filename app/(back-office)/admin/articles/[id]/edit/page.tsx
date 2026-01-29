import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { ArticleForm } from '@/app/components/admin/articles/ArticleForm';

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await Promise.resolve(params);
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  try {
    await requirePermission('ARTICLES', 'edit');
  } catch {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          You don&apos;t have permission to edit articles.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update article information
        </p>
      </div>
      <ArticleForm articleId={id} />
    </div>
  );
}
