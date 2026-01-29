import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { ArticleForm } from '@/app/components/admin/articles/ArticleForm';

export default async function NewArticlePage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  try {
    await requirePermission('ARTICLES', 'create');
  } catch {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          You don&apos;t have permission to create articles.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Article</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new article (author will be set to your account)
        </p>
      </div>
      <ArticleForm />
    </div>
  );
}
