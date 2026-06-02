import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { adminHyundaiCallLimiter, tooManyRequestsResponse } from '@/lib/ratelimit';

type SlikResult = {
  ResultCode?: string;
  ResultDescr?: string;
  [key: string]: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = adminHyundaiCallLimiter.limit(`slik:${session.user.id}`);
    if (!rl.success) {
      return tooManyRequestsResponse(
        'Terlalu banyak permintaan SLIK. Tunggu beberapa saat.',
        rl.retryAfterSec
      );
    }

    await requirePermission('LEADS', 'edit');

    const body = await request.json();
    const { id } = body as { id?: string };

    if (!id) {
      return NextResponse.json({ error: 'Lead id is required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // TODO: ganti ke LeadNo dari LOS ketika sudah tersedia
    const leadNo = lead.id;

    const baseUrl = process.env.API_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: 'API_BASE_URL is not configured' }, { status: 500 });
    }

    // Tandai IN_PROGRESS terlebih dulu (cast supaya tetap jalan sebelum client dire-generate)
    await prisma.lead.update({
      where: { id },
      data: { slikStatus: 'IN_PROGRESS' } as any,
    });

    const payload = {
      requestDateTime: new Date().toISOString(),
      rowVersion: '',
      LeadNo: leadNo,
      CustType: 'CUSTOMER',
    };

    const res = await fetch(
      `${baseUrl}/v1/IntegrationWebsite/GetSLIKResultByLeadNoAndCustType`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data: SlikResult = await res.json();

    if (!res.ok) {
      await prisma.lead.update({
        where: { id },
        data: {
          slikStatus: 'ERROR',
          slikResultCode: data.ResultCode ?? null,
          slikResultDescr: data.ResultDescr ?? `HTTP ${res.status}`,
          slikRawResponse: data,
        } as any,
      });
      return NextResponse.json(
        { error: 'Failed to fetch SLIK result', detail: data },
        { status: 502 }
      );
    }

    const resultCode = data.ResultCode ?? 'UNKNOWN';
    const normalizedStatus =
      resultCode === 'QLF'
        ? 'QUALIFIED'
        : resultCode === 'NQLF'
        ? 'NOT_QUALIFIED'
        : resultCode === 'NS' || resultCode === 'INP'
        ? 'IN_PROGRESS'
        : 'ERROR';

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        slikStatus: normalizedStatus,
        slikResultCode: data.ResultCode ?? null,
        slikResultDescr: data.ResultDescr ?? null,
        slikRawResponse: data,
      } as any,
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: unknown) {
    console.error('Error running SLIK:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

