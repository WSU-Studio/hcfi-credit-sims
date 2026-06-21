import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { isDealerPortalUser, pickDealerProfile } from '@/lib/dealer-portal';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roleNames = user.userRoles.map((ur) => ur.role.name);
    const dealerProfile = pickDealerProfile(user);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        roleNames,
        ...dealerProfile,
      },
      isDealerPortalUser: isDealerPortalUser(user.userType),
    });
  } catch (error) {
    console.error('Error fetching dealer profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
