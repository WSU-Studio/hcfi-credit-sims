import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getS3Bucket } from '@/lib/s3-client';
import { streamS3ObjectAsResponse } from '@/lib/s3-stream';
import { extractBucketAndKeyFromS3Url, isLeadKtpS3Key } from '@/lib/s3-url';

/**
 * Streams KTP image from private S3 for authenticated admins (same-origin, no presign / no Next image optimizer).
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  let bucket: string;
  try {
    bucket = getS3Bucket();
  } catch {
    return NextResponse.json({ error: 'AWS_S3_BUCKET not configured' }, { status: 500 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { ktpUrl: true },
  });

  const rawUrl = lead?.ktpUrl?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const parsed = extractBucketAndKeyFromS3Url(rawUrl);
  if (!parsed || parsed.bucket !== bucket || !isLeadKtpS3Key(parsed.key)) {
    return NextResponse.json({ error: 'Invalid KTP URL' }, { status: 400 });
  }

  return streamS3ObjectAsResponse({
    bucket,
    key: parsed.key,
    cacheControl: 'private, no-store',
    fallbackContentType: 'image/webp',
  });
}
