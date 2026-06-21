import { requirePermission } from '@/lib/permissions';
import { DealerComingSoon } from '@/app/components/dealer/DealerComingSoon';

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
      <DealerComingSoon
        title="Leads Dealer Sales"
        description="Daftar leads dari simulasi salesman akan ditampilkan di sini dengan filter per dealer dan per sales. Data juga tersedia di admin HCFI dengan source DEALER_SALES."
      />
    </div>
  );
}
