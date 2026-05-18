import { NextRequest, NextResponse } from 'next/server';
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

    const where = status ? { status } : {};

    const [rows, total] = await Promise.all([
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
            },
          },
        },
      }),
      prisma.leadOcrResult.count({ where }),
    ]);

    return NextResponse.json({
      results: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error('[admin/lead-ocr]', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch OCR results';
    const status = message.includes('permission') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
