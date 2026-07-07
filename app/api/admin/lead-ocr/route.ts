import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';

async function assertLeadOcrView() {
  try {
    await requirePermission('LEAD_OCR', 'view');
  } catch {
    await requirePermission('LEADS', 'view');
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await assertLeadOcrView();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    const where = status && status !== 'DRAFT' ? { status } : {};

    const [rows, total, draftLeads] = await Promise.all([
      prisma.leadOcrResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              ktpUrl: true,
              ocrSnapshot: true,
            },
          },
        },
      }),
      prisma.leadOcrResult.count({ where }),
      status && status !== 'DRAFT'
        ? Promise.resolve([])
        : prisma.lead.findMany({
            where: {
              ocrSnapshot: { not: Prisma.JsonNull },
              ocrResults: { none: {} },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              ktpUrl: true,
              ocrSnapshot: true,
              createdAt: true,
              simulationLeadNo: true,
            },
          }),
    ]);

    const draftRows = draftLeads.map((lead) => {
      const snapshot = (lead.ocrSnapshot ?? {}) as Record<string, unknown>;
      return {
        id: `draft-${lead.id}`,
        leadId: lead.id,
        hyundaiLeadNo: lead.simulationLeadNo ?? null,
        ktpFileName: null,
        status: 'DRAFT',
        errorMessage: null,
        rawResponse: { source: 'contact_modal_review', snapshot },
        nik: typeof snapshot.nik === 'string' ? snapshot.nik : null,
        nama: typeof snapshot.nama === 'string' ? snapshot.nama : null,
        tempatLahir: typeof snapshot.tempatLahir === 'string' ? snapshot.tempatLahir : null,
        tanggalLahir: typeof snapshot.tanggalLahir === 'string' ? snapshot.tanggalLahir : null,
        jenisKelamin: typeof snapshot.jenisKelamin === 'string' ? snapshot.jenisKelamin : null,
        alamat: typeof snapshot.alamat === 'string' ? snapshot.alamat : null,
        kotaKabupaten: typeof snapshot.kotaKabupaten === 'string' ? snapshot.kotaKabupaten : null,
        kecamatan: typeof snapshot.kecamatan === 'string' ? snapshot.kecamatan : null,
        kelurahanDesa: typeof snapshot.kelurahanDesa === 'string' ? snapshot.kelurahanDesa : null,
        zipCode: typeof snapshot.Zipcode === 'string' ? snapshot.Zipcode : null,
        agama: typeof snapshot.agama === 'string' ? snapshot.agama : null,
        statusPerkawinan:
          typeof snapshot.statusPerkawinan === 'string' ? snapshot.statusPerkawinan : null,
        mrNationalityCode:
          typeof snapshot.mrNationalityCode === 'string' ? snapshot.mrNationalityCode : null,
        addLeadCustPayload: null,
        createdAt: lead.createdAt,
        lead: {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          ktpUrl: lead.ktpUrl,
          ocrSnapshot: lead.ocrSnapshot,
        },
      };
    });

    const merged = [...rows, ...draftRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const filtered = status === 'DRAFT' ? draftRows : merged;

    return NextResponse.json({
      results: filtered,
      pagination: {
        page,
        limit,
        total: status === 'DRAFT' ? draftRows.length : total + draftRows.length,
        totalPages: Math.ceil((status === 'DRAFT' ? draftRows.length : total + draftRows.length) / limit),
      },
    });
  } catch (error: unknown) {
    console.error('[admin/lead-ocr]', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch OCR results';
    const status = message.includes('permission') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
