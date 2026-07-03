import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { LeadsTable } from '@/app/components/admin/leads/LeadsTable';

export default async function LeadsPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }

  try {
    await requirePermission('LEADS', 'view');
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Data kontak dari simulasi kredit</p>
          {/* <Link
            href="/admin/lead-ocr"
            className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
          >
            Lihat hasil OCR KTP →
          </Link> */}
        </div>
      </div>
      <LeadsTable />
    </div>
  );
}
