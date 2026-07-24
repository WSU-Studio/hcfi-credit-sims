import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ slug: string }> };

/** Public lookup by slug — published pre-simulations only. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const item = await prisma.preSimulation.findFirst({
      where: { slug, isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        vendorName: true,
        vendorCity: true,
        modelName: true,
        manufacturingYear: true,
        trimName: true,
        exteriorColorName: true,
        interiorColorName: true,
        vehicleSummary: true,
        otrPrice: true,
        discount: true,
        productName: true,
        productCode: true,
        dpPercent: true,
        tenor: true,
        firstInstallment: true,
        isPromotion: true,
        summarySnapshot: true,
        createdAt: true,
      },
    });
    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error: unknown) {
    console.error('[public/pre-simulations GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
