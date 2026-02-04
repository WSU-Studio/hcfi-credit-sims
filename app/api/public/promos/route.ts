import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const where = {
      isActive: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    } as unknown as Prisma.PromoWhereInput;
    const promos = await prisma.promo.findMany({
      where,
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json({ promos });
  } catch (error) {
    console.error('Error fetching promos:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


