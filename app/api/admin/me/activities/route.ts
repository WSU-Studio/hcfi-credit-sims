import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithRoles = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const activities = new Set<string>();
    userWithRoles?.userRoles.forEach((ur) => {
      (ur.role.activities || []).forEach((act) => {
        if (typeof act === 'string') activities.add(act);
      });
    });

    return NextResponse.json({ activities: Array.from(activities) });
  } catch (error: unknown) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

