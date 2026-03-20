import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientIp, leadsLimiter } from '@/lib/ratelimit';

const isPrivateIp = (ip: string) =>
  !ip ||
  ip === 'unknown' ||
  ip === '127.0.0.1' ||
  ip === '::1' ||
  ip.startsWith('192.168.') ||
  ip.startsWith('10.');

async function getLocationFromIp(ip: string): Promise<{ lat: number; lon: number } | null> {
  if (isPrivateIp(ip)) return null;
  try {
    const res = await fetch(
      `https://ipapi.co/${ip}/json/?fields=latitude,longitude`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const lat = data?.latitude;
    const lon = data?.longitude;
    if (typeof lat === 'number' && typeof lon === 'number') return { lat, lon };
    return null;
  } catch {
    return null;
  }
}

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
      citizenType,
      motherName,
      homeOwnershipStatus,
      consentAccepted,
      latitude,
      longitude,
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
        citizenType:
          citizenType === 'LOCAL' || citizenType === 'FOREIGNER' ? citizenType : null,
        motherName: motherName ? String(motherName).trim() : null,
        homeOwnershipStatus: homeOwnershipStatus ? String(homeOwnershipStatus).trim() : null,
        consentAccepted: Boolean(consentAccepted),
        ipAddress: ip && ip !== 'unknown' ? ip : null,
        status: 'NEW',
    };

    let lat =
      latitude != null && !Number.isNaN(Number(latitude)) ? Number(latitude) : null;
    let lon =
      longitude != null && !Number.isNaN(Number(longitude)) ? Number(longitude) : null;

    if (lat == null || lon == null) {
      const ipGeo = await getLocationFromIp(ip);
      if (ipGeo) {
        lat = lat ?? ipGeo.lat;
        lon = lon ?? ipGeo.lon;
      }
    }

    const lead = await prisma.lead.create({
      // Extra fields are safe at runtime; Prisma will ignore unknown keys
      // until the client is regenerated with the latest schema.
      data: {
        ...leadPayload,
        latitude: lat,
        longitude: lon,
      } as unknown as Parameters<typeof prisma.lead.create>[0]['data'],
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
