import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { SiteSettings } from '@/app/components/admin/settings/SiteSettings';

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  try {
    await requirePermission('SETTINGS', 'view');
  } catch {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Anda tidak memiliki akses ke halaman ini.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Situs</h1>
      </div>
      <SiteSettings />
    </div>
  );
}
