import { requirePermission } from '@/lib/permissions';
import { DealerLeadsTable } from '@/app/components/dealer/leads/DealerLeadsTable';

export default async function DealerLeadsPage() {
  try {
    await requirePermission('DEALER_LEADS', 'view');
  } catch {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Anda tidak memiliki akses ke halaman ini.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="mt-1 text-sm text-gray-500">
          Data leads dari quotation dealer sales
        </p>
      </div>
      <DealerLeadsTable />
    </div>
  );
}
