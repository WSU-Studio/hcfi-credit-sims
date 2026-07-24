import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { requireActivity, requirePermission } from '@/lib/permissions';
import { AUDIT_ACTIONS, actorFromSession, recordAudit } from '@/lib/security/audit-log';

function isPurgeEnabled(): boolean {
  return (process.env.ALLOW_LEADS_PURGE ?? '').trim().toLowerCase() === 'true';
}

function getConfirmPhrase(): string {
  return (process.env.LEADS_PURGE_CONFIRM_PHRASE ?? '').trim();
}

/** Constant-time string compare; rejects empty expected phrase. */
function phrasesMatch(provided: string, expected: string): boolean {
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * GET — status Danger Zone (enabled flag + counts). Never returns the confirm phrase.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('SETTINGS', 'view');
    await requireActivity('leads.purgeAll');

    const enabled = isPurgeEnabled();
    const phraseConfigured = getConfirmPhrase().length > 0;

    const [leadCount, draftCount] = await Promise.all([
      prisma.lead.count(),
      prisma.leadAssetDraft.count(),
    ]);

    return NextResponse.json({
      enabled,
      phraseConfigured,
      leadCount,
      draftCount,
    });
  } catch (error: unknown) {
    console.error('[admin/leads/purge GET]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST — hapus semua Lead (+ LeadAssetDraft terkait uji coba).
 * Body: { confirmPhrase: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('SETTINGS', 'view');
    await requireActivity('leads.purgeAll');

    if (!isPurgeEnabled()) {
      return NextResponse.json(
        { error: 'Purge dinonaktifkan. Set ALLOW_LEADS_PURGE=true di environment.' },
        { status: 403 }
      );
    }

    const expected = getConfirmPhrase();
    if (!expected) {
      return NextResponse.json(
        { error: 'LEADS_PURGE_CONFIRM_PHRASE belum dikonfigurasi di environment.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    const confirmPhrase =
      typeof body?.confirmPhrase === 'string' ? body.confirmPhrase.trim() : '';

    if (!phrasesMatch(confirmPhrase, expected)) {
      return NextResponse.json({ error: 'Phrase konfirmasi tidak cocok.' }, { status: 400 });
    }

    const [leadCountBefore, draftCountBefore] = await Promise.all([
      prisma.lead.count(),
      prisma.leadAssetDraft.count(),
    ]);

    const result = await prisma.$transaction(async (tx) => {
      // OCR results cascade dari Lead; HyundaiApiCallLog leadId di-set null.
      const deletedLeads = await tx.lead.deleteMany({});
      const deletedDrafts = await tx.leadAssetDraft.deleteMany({});
      return { deletedLeads: deletedLeads.count, deletedDrafts: deletedDrafts.count };
    });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.LEAD_PURGE_ALL,
      resourceType: 'Lead',
      metadata: {
        deletedLeads: result.deletedLeads,
        deletedDrafts: result.deletedDrafts,
        leadCountBefore,
        draftCountBefore,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      deletedLeads: result.deletedLeads,
      deletedDrafts: result.deletedDrafts,
    });
  } catch (error: unknown) {
    console.error('[admin/leads/purge POST]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
