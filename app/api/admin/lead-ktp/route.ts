import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';
import { extractBucketAndKeyFromS3Url, isLeadKtpS3Key } from '@/lib/s3-url';

function getS3Client(): S3Client {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing AWS env for S3');
  }
  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function bodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body) throw new Error('Empty S3 body');
  if (body instanceof Uint8Array) return Buffer.from(body);
  const chunks: Buffer[] = [];
  const stream = body as AsyncIterable<Uint8Array>;
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Streams KTP image from private S3 for authenticated admins (same-origin, no presign / no Next image optimizer).
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const bucket = process.env.AWS_S3_BUCKET?.trim();
  if (!bucket) {
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

  try {
    const client = getS3Client();
    const out = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: parsed.key,
      })
    );

    const buf = await bodyToBuffer(out.Body);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': out.ContentType ?? 'image/webp',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('[lead-ktp] GetObject failed', err);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 502 });
  }
}
