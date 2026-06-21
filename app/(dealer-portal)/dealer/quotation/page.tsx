import { requirePermission } from '@/lib/permissions';
import { DealerQuotationClient } from '@/app/components/dealer/DealerQuotationClient';

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

  return <DealerQuotationClient />;
}
