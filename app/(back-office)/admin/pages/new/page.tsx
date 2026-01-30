import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { PageForm } from '@/app/components/admin/pages/PageForm';

export default async function NewPagePage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  try {
    await requirePermission('PAGES', 'create');
  } catch {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          You don&apos;t have permission to create pages.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Page</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new static page with widget-based layout for Informasi
        </p>
      </div>
      <PageForm />
    </div>
  );
}
