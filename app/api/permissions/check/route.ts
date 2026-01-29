import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { checkPermission } from '@/lib/permissions';
import type { PermissionAction } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ hasPermission: false }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const menuCode = searchParams.get('menuCode');
    const action = searchParams.get('action') as PermissionAction || 'view';

    if (!menuCode) {
      return NextResponse.json({ error: 'menuCode is required' }, { status: 400 });
    }

    const hasPermission = await checkPermission(session.user.id, menuCode, action);

    return NextResponse.json({ hasPermission });
  } catch (error: unknown) {
    console.error('Error checking permission:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

