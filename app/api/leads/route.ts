import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, productName, otrPrice, dpPercent, tenor } = body;

    if (!name || !phone || !email) {
      return NextResponse.json({ error: 'Name, phone, and email are required' }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name: String(name).trim(),
        phone: String(phone).trim(),
        email: String(email).trim(),
        productName: productName ? String(productName).trim() : null,
        otrPrice: otrPrice ? Number(otrPrice) : null,
        dpPercent: dpPercent ? Number(dpPercent) : null,
        tenor: tenor ? Number(tenor) : null,
        status: 'NEW',
      },
    });

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
