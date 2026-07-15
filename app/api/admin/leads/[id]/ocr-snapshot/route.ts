import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth-server';
import { requirePermission, requireActivity } from '@/lib/permissions';
import { AUDIT_ACTIONS, actorFromSession, recordAudit } from '@/lib/security/audit-log';
import {
  coerceOcrKtpSnapshot,
  isOcrKtpSnapshotComplete,
  normalizeOcrBirthDate,
  ocrKtpSnapshotSchema,
  sanitizeOcrKtpSnapshotDigits,
} from '@/lib/ocr-ktp-snapshot';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET — ambil ocrSnapshot lead (untuk modal edit admin).
 * PATCH — koreksi ocrSnapshot sebelum SUBMIT ulang ke Confins.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('LEADS', 'view');

    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        hyundaiAssignStatus: true,
        hyundaiLeadNo: true,
        ocrSnapshot: true,
      },
    });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: lead.id,
      name: lead.name,
      hyundaiAssignStatus: lead.hyundaiAssignStatus,
      hyundaiLeadNo: lead.hyundaiLeadNo,
      ocrSnapshot: coerceOcrKtpSnapshot(lead.ocrSnapshot),
    });
  } catch (error: unknown) {
    console.error('[admin/leads/ocr-snapshot GET]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('LEADS', 'edit');
    await requireActivity('leads.editOcrSnapshot');

    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        hyundaiAssignStatus: true,
        hyundaiLeadNo: true,
        ocrSnapshot: true,
      },
    });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.hyundaiAssignStatus === 'SUBMITTED' && lead.hyundaiLeadNo) {
      return NextResponse.json(
        {
          error:
            'Lead sudah terkirim ke Confins. Data KTP tidak bisa diubah dari CMS.',
        },
        { status: 409 }
      );
    }

    if (lead.hyundaiAssignStatus === 'SUBMITTING') {
      return NextResponse.json(
        {
          error:
            'Lead sedang dalam proses submit. Tunggu selesai sebelum mengubah data KTP.',
        },
        { status: 409 }
      );
    }

    const body = await request.json();
    const parsed = ocrKtpSnapshotSchema.safeParse(body.ocrSnapshot ?? body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data KTP tidak valid', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const cleaned = sanitizeOcrKtpSnapshotDigits(parsed.data);
    const birth = normalizeOcrBirthDate(cleaned.tanggalLahir);
    const snapshot = {
      ...cleaned,
      tanggalLahir: birth ?? cleaned.tanggalLahir.trim(),
    };

    if (!isOcrKtpSnapshotComplete(snapshot)) {
      return NextResponse.json(
        {
          error:
            'Data KTP belum lengkap / belum valid. Periksa NIK, tanggal lahir, RT/RW, dan kode pos.',
        },
        { status: 400 }
      );
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ocrSnapshot: snapshot,
        // Hapus error submit lama supaya admin bisa retry submit dengan data baru.
        hyundaiAssignError: null,
        hyundaiAssignStatus:
          lead.hyundaiAssignStatus === 'FAILED' ? 'PENDING' : lead.hyundaiAssignStatus,
      },
      select: {
        id: true,
        ocrSnapshot: true,
        hyundaiAssignStatus: true,
        hyundaiAssignError: true,
      },
    });

    await recordAudit({
      actor: actorFromSession(session),
      action: AUDIT_ACTIONS.LEAD_OCR_SNAPSHOT_UPDATE,
      resourceType: 'Lead',
      resourceId: id,
      metadata: {
        leadName: lead.name,
        leadEmail: lead.email,
        zipcode: snapshot.Zipcode,
        kotaKabupaten: snapshot.kotaKabupaten,
        previousZipcode:
          lead.ocrSnapshot &&
          typeof lead.ocrSnapshot === 'object' &&
          lead.ocrSnapshot !== null &&
          'Zipcode' in lead.ocrSnapshot
            ? String((lead.ocrSnapshot as { Zipcode?: unknown }).Zipcode ?? '')
            : null,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      lead: updated,
    });
  } catch (error: unknown) {
    console.error('[admin/leads/ocr-snapshot PATCH]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
