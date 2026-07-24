import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { isLeadScoringComplete } from '@/lib/lead-scoring-complete';
import { leadCompleteScoringSchema } from '@/lib/security/schemas';
import { AUDIT_ACTIONS, actorFromSession, recordAudit } from '@/lib/security/audit-log';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH — admin melengkapi data credit scoring untuk lead yang submit tanpa Fast Track.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('LEADS', 'edit');

    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        ktpUrl: true,
        motherName: true,
        homeOwnershipStatus: true,
        ocrSnapshot: true,
        hyundaiAssignStatus: true,
        hyundaiLeadNo: true,
      },
    });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.hyundaiAssignStatus === 'SUBMITTED' && lead.hyundaiLeadNo) {
      return NextResponse.json(
        { error: 'Lead sudah dikirim ke Hyundai; data scoring tidak dapat diubah.' },
        { status: 409 }
      );
    }

    if (isLeadScoringComplete(lead)) {
      return NextResponse.json(
        { error: 'Data credit scoring lead ini sudah lengkap.' },
        { status: 409 }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = leadCompleteScoringSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: 'Invalid input',
          field: firstIssue?.path?.join('.') ?? 'input',
          message: firstIssue?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updated = await prisma.lead.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        ktpUrl: data.ktpUrl,
        ocrSnapshot: data.ocrSnapshot as object,
        citizenType: data.citizenType,
        motherName: data.motherName,
        homeOwnershipStatus: data.homeOwnershipStatus,
        consentAccepted: true,
      },
    });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.LEAD_COMPLETE_SCORING,
      resourceType: 'Lead',
      resourceId: updated.id,
      metadata: {
        leadEmail: data.email,
        leadName: data.name,
        previousEmail: lead.email,
        previousName: lead.name,
        citizenType: data.citizenType,
      },
      request,
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: unknown) {
    console.error('[admin/leads/complete-scoring PATCH]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
