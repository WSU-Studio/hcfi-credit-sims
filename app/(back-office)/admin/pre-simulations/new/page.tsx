import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { PreSimulationCreateClient } from '@/app/components/admin/pre-simulations/PreSimulationCreateClient';

export default async function NewPreSimulationPage() {
  const session = await auth();
  if (!session) redirect('/auth/login');

  try {
    await requirePermission('PRE_SIMULATIONS', 'create');
  } catch {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          You don&apos;t have permission to create pre-simulations.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/pre-simulations" className="text-sm text-[#1956FF] hover:underline">
          ← Kembali ke daftar
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Buat Pre-Simulasi</h1>
      <PreSimulationCreateClient />
    </div>
  );
}
