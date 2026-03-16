import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientIp, leadsLimiter } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = leadsLimiter.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      productName,
      vehicleSummary,
      otrPrice,
      dpPercent,
      tenor,
      ktpUrl,
      motherName,
      homeOwnershipStatus,
      consentAccepted,
    } = body;

    if (!name || !phone || !email) {
      return NextResponse.json({ error: 'Name, phone, and email are required' }, { status: 400 });
    }

    const leadPayload = {
        name: String(name).trim(),
        phone: String(phone).trim(),
        email: String(email).trim(),
        productName: productName ? String(productName).trim() : null,
        vehicleSummary: vehicleSummary ? String(vehicleSummary).trim() : null,
        otrPrice: otrPrice ? Number(otrPrice) : null,
        dpPercent: dpPercent ? Number(dpPercent) : null,
        tenor: tenor ? Number(tenor) : null,
        ktpUrl: ktpUrl ? String(ktpUrl).trim() : null,
        motherName: motherName ? String(motherName).trim() : null,
        homeOwnershipStatus: homeOwnershipStatus ? String(homeOwnershipStatus).trim() : null,
        consentAccepted: Boolean(consentAccepted),
        status: 'NEW',
    };

    const lead = await prisma.lead.create({
      // Extra fields are safe at runtime; Prisma will ignore unknown keys
      // until the client is regenerated with the latest schema.
      data: leadPayload as unknown as Parameters<typeof prisma.lead.create>[0]['data'],
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
