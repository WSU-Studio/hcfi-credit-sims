import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { readLeadKtpBytes } from '@/lib/lead-ktp-storage';
import { parseKtpStorageUrl } from '@/lib/ktp-url';
import { getS3Bucket } from '@/lib/s3-client';

/**
 * Streams KTP image for authenticated admins with LEADS view permission
 * (same-origin, no presign / no Next image optimizer).
 * Mendukung S3 (production) dan penyimpanan lokal dev (`KTP_STORAGE=local`).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('LEADS', 'view');

    const id = request.nextUrl.searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { ktpUrl: true },
    });

    const rawUrl = lead?.ktpUrl?.trim();
    if (!rawUrl) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const ref = parseKtpStorageUrl(rawUrl);
    if (!ref) {
      return NextResponse.json({ error: 'Invalid KTP URL' }, { status: 400 });
    }

    if (ref.kind === 's3') {
      try {
        const bucket = getS3Bucket();
        if (ref.bucket !== bucket) {
          return NextResponse.json({ error: 'Invalid KTP URL' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: 'AWS_S3_BUCKET not configured' }, { status: 500 });
      }
    }

    try {
      const { buffer, contentType } = await readLeadKtpBytes(rawUrl);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, no-store',
        },
      });
    } catch (err) {
      console.error('[lead-ktp] read failed', { id, err });
      return NextResponse.json({ error: 'Failed to load KTP' }, { status: 502 });
    }
  } catch (error: unknown) {
    console.error('[lead-ktp]', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
