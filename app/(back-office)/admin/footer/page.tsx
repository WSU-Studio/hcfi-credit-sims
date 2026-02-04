import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { FooterSettings } from '@/app/components/admin/footer/FooterSettings';

export default async function FooterPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }

  try {
    await requirePermission('FOOTER', 'view');
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
        <h1 className="text-2xl font-bold text-gray-900">Footer Settings</h1>
      </div>
      <FooterSettings />
    </div>
  );
}


