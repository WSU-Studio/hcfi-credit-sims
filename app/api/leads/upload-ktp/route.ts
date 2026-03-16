import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { validateImageFile } from '@/lib/image-utils';
import { getClientIp, leadsLimiter } from '@/lib/ratelimit';

const FOLDER = 'hcfi_leads_ktp';

function getS3Client() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('Set di .env: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getPublicUrl(bucket: string, region: string, key: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = leadsLimiter.limit(`ktp:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: 'Terlalu banyak upload. Silakan coba lagi beberapa saat.' },
      { status: 429 }
    );
  }

  try {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) {
      return NextResponse.json(
        { error: 'Set di .env: AWS_S3_BUCKET, AWS_REGION' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'File KTP wajib diisi' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const validation = validateImageFile(inputBuffer);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const webpBuffer = await sharp(inputBuffer)
      .webp({ quality: 80 })
      .toBuffer();

    const key = `${FOLDER}/${randomUUID()}-${Date.now()}.webp`;

    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: webpBuffer,
        ContentType: 'image/webp',
      })
    );

    const url = getPublicUrl(bucket, region, key);

    return NextResponse.json({ url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload gagal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

