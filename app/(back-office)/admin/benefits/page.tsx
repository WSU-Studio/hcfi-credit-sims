import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { BenefitsSettings } from '@/app/components/admin/benefits/BenefitsSettings';

export default async function BenefitsPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  try {
    await requirePermission('BENEFITS', 'view');
  } catch {
    return (
      <div className="p-6">
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          You don&apos;t have permission to view this page.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Benefit Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola poin-poin Benefit Card yang tampil di halaman utama secara dinamis.
        </p>
      </div>
      <BenefitsSettings />
    </div>
  );
}

