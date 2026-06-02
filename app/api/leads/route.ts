import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientIp, leadsLimiter, tooManyRequestsResponse } from '@/lib/ratelimit';
import { leadCreateSchema } from '@/lib/security/schemas';
import { isHoneypotTripped, HONEYPOT_FIELD } from '@/lib/security/honeypot';

const isPrivateOrLocalIp = (ip: string) =>
  !ip ||
  ip === 'unknown' ||
  ip === '127.0.0.1' ||
  ip === '::1' ||
  ip === '::ffff:127.0.0.1' ||
  ip.startsWith('192.168.') ||
  ip.startsWith('10.') ||
  ip.startsWith('172.');

async function getLocationFromIp(ip: string): Promise<{ lat: number; lon: number } | null> {
  if (isPrivateOrLocalIp(ip)) return null;
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
  const serverIp = getClientIp(request);
  const rl = leadsLimiter.limit(serverIp);
  if (!rl.success) {
    return tooManyRequestsResponse(
      'Too many submissions. Please try again later.',
      rl.retryAfterSec
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Honeypot: silently accept and discard bot traffic so the scanner does not
  // learn the trap exists. Return a fake 201 with no DB write.
  if (rawBody && typeof rawBody === 'object' && isHoneypotTripped((rawBody as Record<string, unknown>)[HONEYPOT_FIELD])) {
    console.warn('[leads] honeypot tripped from ip=%s', serverIp);
    return NextResponse.json({ success: true, id: 'discarded' }, { status: 201 });
  }

  const parsed = leadCreateSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const fieldPath = firstIssue?.path?.join('.') ?? 'input';
    return NextResponse.json(
      {
        error: 'Invalid input',
        field: fieldPath,
        message: firstIssue?.message ?? 'Validation failed',
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const leadPayload = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      productName: data.productName,
      vehicleSummary: data.vehicleSummary,
      assetSnapshot:
        data.assetSnapshot && typeof data.assetSnapshot === 'object'
          ? (data.assetSnapshot as object)
          : null,
      vendorCode: data.vendorCode,
      vendorName: data.vendorName,
      vendorCity: data.vendorCity,
      oriOfficeCode: data.oriOfficeCode,
      oriOfficeName: data.oriOfficeName,
      otrPrice: data.otrPrice,
      dpPercent: data.dpPercent,
      tenor: data.tenor != null ? Math.trunc(data.tenor) : null,
      ktpUrl: data.ktpUrl,
      citizenType: data.citizenType,
      motherName: data.motherName,
      homeOwnershipStatus: data.homeOwnershipStatus,
      consentAccepted: Boolean(data.consentAccepted),
      status: 'NEW',
    };

    // Server-derived IP only. We intentionally do NOT trust any client-supplied
    // `clientPublicIp` field — that would let bots spoof the IP column.
    const ipAddress = serverIp && !isPrivateOrLocalIp(serverIp) ? serverIp : null;

    let lat = data.latitude;
    let lon = data.longitude;

    if (lat == null || lon == null) {
      const ipGeo = ipAddress ? await getLocationFromIp(ipAddress) : null;
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
        ipAddress,
        latitude: lat,
        longitude: lon,
      } as unknown as Parameters<typeof prisma.lead.create>[0]['data'],
    });

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
