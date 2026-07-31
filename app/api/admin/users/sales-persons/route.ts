import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { hyundaiPost } from '@/lib/hyundai-api-post';

type HyundaiKeyValue = { Key: string; Value: string };

/**
 * Daftar sales person aktif per vendor (Postman: Get List Sales Person).
 * Dipakai form user management untuk memilih CMO Employee No salesman.
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

    const data = await hyundaiPost<{ ReturnObject?: HyundaiKeyValue[] }>(
      '/v1/VendorEmp/GetListKeyValueActiveSalesPersonByVendorCode',
      { Code: vendorCode }
    );

    return NextResponse.json({ salesPersons: data.ReturnObject ?? [] });
  } catch (error: unknown) {
    console.error('[admin/users/sales-persons]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to load sales persons',
      },
      { status: 500 }
    );
  }
}
