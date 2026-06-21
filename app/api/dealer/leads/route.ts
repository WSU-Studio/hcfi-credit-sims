import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildDealerLeadsWhere,
  requireDealerLeadsScope,
} from '@/lib/dealer-leads-access';

export async function GET(request: NextRequest) {
  try {
    const scope = await requireDealerLeadsScope();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const where = buildDealerLeadsWhere(scope, { status });

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          salesUser: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      scope: {
        isSalesman: scope.isSalesman,
        isDealerAdmin: scope.isDealerAdmin,
        vendorCode: scope.vendorCode,
        vendorName: scope.vendorName,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden') || error.message.includes('penugasan')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error('Error fetching dealer leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
