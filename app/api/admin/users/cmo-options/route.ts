import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { fetchSalesPersonsByVendor } from '@/lib/hyundai-lead-integration';

/**
 * Daftar CMO per dealer (Hyundai: Get Office Member Cmo) untuk form user
 * management. Terpisah dari /api/admin/leads/sales-persons karena permission
 * halaman ini USERS, bukan LEADS.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('USERS', 'view');

    const vendorCode = new URL(request.url).searchParams.get('vendorCode');
    if (!vendorCode) {
      return NextResponse.json({ error: 'vendorCode is required' }, { status: 400 });
    }

    // oriOfficeCode dikosongkan supaya seluruh CMO dealer ikut terdaftar
    // (sama seperti dropdown CMO di halaman leads).
    const cmoOptions = await fetchSalesPersonsByVendor(vendorCode, {
      oriOfficeCode: '',
    });
    return NextResponse.json({ cmoOptions });
  } catch (error: unknown) {
    console.error('[admin/users/cmo-options]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load CMO list' },
      { status: 500 }
    );
  }
}
