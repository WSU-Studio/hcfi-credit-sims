import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { UsersTable } from '@/app/components/admin/users/UsersTable';

export default async function UsersPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }

  try {
    await requirePermission('USERS', 'view');
  } catch {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          You don&apos;t have permission to view this page.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
      </div>
      <UsersTable />
    </div>
  );
}

