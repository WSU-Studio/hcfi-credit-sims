import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { VehicleModelImagesManager } from '@/app/components/admin/vehicle-models/VehicleModelImagesManager';

export default async function VehicleModelsPage() {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  try {
    await requirePermission('VEHICLE_MODELS', 'view');
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
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Model Images</h1>
        <p className="mt-1 text-sm text-gray-500">
          Kelola gambar model mobil untuk dipakai di simulasi kredit saat data model berasal dari Confins.
        </p>
      </div>
      <VehicleModelImagesManager />
    </div>
  );
}
