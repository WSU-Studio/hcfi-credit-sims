import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('LEADS', 'view');

    const leadNo = new URL(request.url).searchParams.get('leadNo')?.trim();
    if (!leadNo) {
      return NextResponse.json({ error: 'leadNo is required' }, { status: 400 });
    }

    const [draft, lead] = await Promise.all([
      prisma.leadAssetDraft.findUnique({
        where: { hyundaiLeadNo: leadNo },
        select: {
          id: true,
          hyundaiLeadNo: true,
          salesEmpNo: true,
          vendorCode: true,
          vendorName: true,
          createdAt: true,
          convertedLeadId: true,
          status: true,
        },
      }),
      prisma.lead.findFirst({
        where: {
          OR: [{ simulationLeadNo: leadNo }, { hyundaiLeadNo: leadNo }],
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          simulationLeadNo: true,
          hyundaiLeadNo: true,
          source: true,
          salesEmpNo: true,
          salesUserId: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      leadNo,
      draft,
      lead,
      checks: {
        draftExists: Boolean(draft),
        draftSalesEmpNo: draft?.salesEmpNo ?? null,
        leadExists: Boolean(lead),
        leadSalesEmpNo: lead?.salesEmpNo ?? null,
        matches: (draft?.salesEmpNo ?? null) === (lead?.salesEmpNo ?? null),
      },
    });
  } catch (error: unknown) {
    console.error('[admin/leads/debug-supplier-emp]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
