import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { preSimulationCreateSchema } from '@/lib/security/pre-simulation-schemas';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('PRE_SIMULATIONS', 'view');

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.preSimulation.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.preSimulation.count(),
    ]);

    return NextResponse.json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    console.error('[admin/pre-simulations GET]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('PRE_SIMULATIONS', 'create');

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = preSimulationCreateSchema.safeParse(rawBody);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: 'Invalid input',
          field: first?.path?.join('.') ?? 'input',
          message: first?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const existing = await prisma.preSimulation.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Slug sudah digunakan', field: 'slug', message: 'Slug sudah digunakan.' },
        { status: 409 }
      );
    }

    const item = await prisma.preSimulation.create({
      data: {
        title: data.title,
        slug: data.slug,
        isPublished: data.isPublished,
        vendorCode: data.vendorCode,
        vendorName: data.vendorName,
        vendorCity: data.vendorCity,
        oriOfficeCode: data.oriOfficeCode,
        oriOfficeName: data.oriOfficeName,
        modelCode: data.modelCode,
        modelName: data.modelName,
        manufacturingYear: data.manufacturingYear ?? null,
        fscCode: data.fscCode,
        trimName: data.trimName,
        exteriorColorCode: data.exteriorColorCode,
        exteriorColorName: data.exteriorColorName,
        interiorColorCode: data.interiorColorCode,
        interiorColorName: data.interiorColorName,
        vehicleSummary: data.vehicleSummary,
        assetSnapshot:
          data.assetSnapshot && typeof data.assetSnapshot === 'object'
            ? (data.assetSnapshot as object)
            : undefined,
        otrPrice: data.otrPrice,
        discount: data.discount ?? null,
        partnerCode: data.partnerCode,
        simulationLeadNo: data.simulationLeadNo,
        productCode: data.productCode,
        productName: data.productName,
        dpPercent: data.dpPercent,
        tenor: data.tenor,
        firstInstallment: data.firstInstallment,
        isPromotion: data.isPromotion,
        summarySnapshot: data.summarySnapshot as object,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: unknown) {
    console.error('[admin/pre-simulations POST]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
