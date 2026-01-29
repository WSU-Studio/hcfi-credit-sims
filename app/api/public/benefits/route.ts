import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const benefits = await prisma.benefit.findMany({
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json({ benefits });
  } catch (error) {
    console.error('Error fetching benefits:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


