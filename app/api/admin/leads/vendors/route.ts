import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { fetchVendorsForAssignment } from '@/lib/hyundai-lead-integration';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('LEADS', 'view');

    const vendors = await fetchVendorsForAssignment();
    return NextResponse.json({ vendors });
  } catch (error: unknown) {
    console.error('[admin/leads/vendors]', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load vendors',
      },
      { status: 500 }
    );
  }
}
