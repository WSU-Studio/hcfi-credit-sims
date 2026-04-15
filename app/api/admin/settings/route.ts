import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

const KEYS = [
  'gtmId',
  'gaMeasurementId',
  'whatsappFabPhone',
  'whatsappFabMessage',
  'whatsappFabCtaText',
  'whatsappFabVisible',
  'whatsappLeadPhone',
  'mockApiEnabled',
  'mockApiContent',
] as const;

function toPayload(settings: { key: string; value: string }[]) {
  const data: Record<string, string> = {};
  settings.forEach((s) => {
    data[s.key] = s.value;
  });
  KEYS.forEach((k) => {
    if (!(k in data)) data[k] = '';
  });
  return data;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('SETTINGS', 'view');

    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: [...KEYS] } },
    });
    return NextResponse.json({ data: toPayload(settings) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Forbidden')) {
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
    await requirePermission('SETTINGS', 'edit');

    const body = (await request.json()) as Record<string, unknown>;
    for (const key of KEYS) {
      const value = body[key];
      const str = value == null ? '' : typeof value === 'string' ? value : String(value);
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: str.trim() },
        create: { key, value: str.trim() },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
