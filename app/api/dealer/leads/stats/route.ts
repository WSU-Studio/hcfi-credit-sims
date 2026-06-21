import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildDealerLeadsWhere,
  requireDealerLeadsScope,
} from '@/lib/dealer-leads-access';

const STATUS_KEYS = ['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED'] as const;

export async function GET() {
  try {
    const scope = await requireDealerLeadsScope();
    const where = buildDealerLeadsWhere(scope);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, thisMonth, statusGroups] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.count({
        where: { ...where, createdAt: { gte: monthStart } },
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ]);

    const byStatus = Object.fromEntries(
      STATUS_KEYS.map((status) => [status, 0])
    ) as Record<string, number>;

    for (const row of statusGroups) {
      byStatus[row.status] = row._count._all;
    }

    return NextResponse.json({
      total,
      thisMonth,
      byStatus,
      scope: {
        isSalesman: scope.isSalesman,
        isDealerAdmin: scope.isDealerAdmin,
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
    console.error('Error fetching dealer lead stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
