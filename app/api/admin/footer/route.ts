import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';

import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('FOOTER', 'view');

    const settings = await prisma.footerSetting.findMany();
    const data: any = {};

    settings.forEach((setting) => {
      try {
        data[setting.key] = JSON.parse(setting.value);
      } catch {
        data[setting.key] = setting.value;
      }
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('FOOTER', 'edit');

    const body = await request.json();

    for (const [key, value] of Object.entries(body)) {
      await prisma.footerSetting.upsert({
        where: { key },
        update: {
          value: typeof value === 'string' ? value : JSON.stringify(value),
        },
        create: {
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


