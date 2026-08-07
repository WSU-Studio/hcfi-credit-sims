import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { watermarkStoredKtp } from '@/lib/ktp-watermark-storage';
import { AUDIT_ACTIONS, actorFromSession, recordAudit } from '@/lib/security/audit-log';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST — watermark KTP yang sudah tersimpan (overwrite key yang sama, tanpa duplikat).
 * Body opsional: `{ "force": true }` untuk stamp ulang meskipun metadata sudah ada.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('LEADS', 'edit');

    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, ktpUrl: true, name: true },
    });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const rawUrl = lead.ktpUrl?.trim();
    if (!rawUrl) {
      return NextResponse.json({ error: 'Lead belum memiliki foto KTP' }, { status: 400 });
    }

    let force = false;
    try {
      const body = await request.json();
      force = Boolean(body?.force);
    } catch {
      // empty body is fine
    }

    const result = await watermarkStoredKtp(rawUrl, { force });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.LEAD_WATERMARK_KTP,
      resourceType: 'Lead',
      resourceId: lead.id,
      request,
      metadata: {
        leadName: lead.name,
        status: result.status,
        key: result.key,
        force,
      },
    });

    if (result.status === 'already_watermarked') {
      return NextResponse.json({
        ok: true,
        status: result.status,
        message: 'KTP sudah berwatermark. Kirim force=true untuk stamp ulang.',
      });
    }

    return NextResponse.json({
      ok: true,
      status: result.status,
      message: 'Watermark berhasil diterapkan (file diganti di tempat, tanpa duplikat).',
    });
  } catch (error: unknown) {
    console.error('[watermark-ktp]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Gagal menerapkan watermark KTP';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
