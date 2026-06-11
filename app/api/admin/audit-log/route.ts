import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

/**
 * Paginated audit-log listing for admins. Filters:
 *   - action: exact match on action string
 *   - resourceType: exact match
 *   - resourceId: exact match
 *   - actorUserId: exact match
 *   - from / to: ISO date range on createdAt
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('AUDIT_LOG', 'view');

    const sp = new URL(request.url).searchParams;
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(sp.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const where: {
      action?: string;
      resourceType?: string;
      resourceId?: string;
      actorUserId?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    const action = sp.get('action');
    const resourceType = sp.get('resourceType');
    const resourceId = sp.get('resourceId');
    const actorUserId = sp.get('actorUserId');
    const from = sp.get('from');
    const to = sp.get('to');

    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (resourceId) where.resourceId = resourceId;
    if (actorUserId) where.actorUserId = actorUserId;
    if (from || to) {
      where.createdAt = {};
      if (from) {
        const d = new Date(from);
        if (!isNaN(d.getTime())) where.createdAt.gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!isNaN(d.getTime())) where.createdAt.lte = d;
      }
    }

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      entries: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error('[admin/audit-log]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
