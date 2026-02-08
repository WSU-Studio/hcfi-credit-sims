import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { getUserPermissions } from '@/lib/permissions';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ permissions: null }, { status: 401 });
    }

    const permissions = await getUserPermissions(session.user.id);
    return NextResponse.json({ permissions: permissions ?? {} });
  } catch (error: unknown) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
