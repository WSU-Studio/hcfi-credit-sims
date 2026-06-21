import { requirePermission } from '@/lib/permissions';
import { DealerComingSoon } from '@/app/components/dealer/DealerComingSoon';

export default async function DealerQuotationPage() {
  try {
    await requirePermission('DEALER_QUOTATION', 'view');
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
        <h1 className="text-2xl font-bold text-gray-900">Quotation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Simulasi kredit untuk pelanggan — dealer & cabang terisi otomatis
        </p>
      </div>
      <DealerComingSoon
        title="Quotation / Simulasi Sales"
        description="Flow simulasi kredit seperti website publik, namun melewati pemilihan dealer karena sudah terikat ke akun Anda. Lead akan tercatat dengan source dealer sales."
      />
    </div>
  );
}
