import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { fetchSalesPersonsByVendor } from '@/lib/hyundai-lead-integration';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('LEADS', 'view');

    const vendorCode = new URL(request.url).searchParams.get('vendorCode');
    const oriOfficeCode = new URL(request.url).searchParams.get('oriOfficeCode');
    if (!vendorCode) {
      return NextResponse.json({ error: 'vendorCode is required' }, { status: 400 });
    }

    const salesPersons = await fetchSalesPersonsByVendor(vendorCode, {
      // oriOfficeCode: oriOfficeCode || undefined,
      // request Hyundai untuk kosongkan oriOfficeCode supaya tarik semua CMO
      oriOfficeCode: '',
    });
    return NextResponse.json({ salesPersons });
  } catch (error: unknown) {
    console.error('[admin/leads/sales-persons]', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load CMO list',
      },
      { status: 500 }
    );
  }
}
