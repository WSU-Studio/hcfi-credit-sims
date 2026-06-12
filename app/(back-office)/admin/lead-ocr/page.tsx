import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { LeadOcrTable } from '@/app/components/admin/lead-ocr/LeadOcrTable';
import { OcrTestPanel } from '@/app/components/admin/lead-ocr/OcrTestPanel';

async function assertView() {
  try {
    await requirePermission('LEAD_OCR', 'view');
  } catch {
    await requirePermission('LEADS', 'view');
  }
}

export default async function LeadOcrPage() {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  try {
    await assertView();
  } catch {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Anda tidak memiliki akses untuk melihat halaman ini.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hasil OCR KTP</h1>
        <p className="text-sm text-gray-500 mt-1">
          Data hasil pembacaan KTP dari Hyundai API saat lead di-SUBMIT ke LOS (otomatis, tanpa langkah
          tambahan).
        </p>
      </div>

      <OcrTestPanel defaultOpen={false} />

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Riwayat OCR dari Lead</h2>
        <LeadOcrTable />
      </div>
    </div>
  );
}
