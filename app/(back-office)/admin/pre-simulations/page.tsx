import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { PreSimulationsTable } from '@/app/components/admin/pre-simulations/PreSimulationsTable';

export default async function PreSimulationsPage() {
  const session = await auth();
  if (!session) redirect('/auth/login');

  try {
    await requirePermission('PRE_SIMULATIONS', 'view');
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
        <h1 className="text-2xl font-bold text-gray-900">Pre-Simulasi Event</h1>
      </div>
      <PreSimulationsTable />
    </div>
  );
}
