import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { validateImageFile } from '@/lib/image-utils';
import { getClientIp, leadsLimiter } from '@/lib/ratelimit';
import { getPublicS3Url, getS3Bucket, getS3Client, getS3Region } from '@/lib/s3-client';

const FOLDER = 'hcfi_leads_ktp';

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
    const bucket = getS3Bucket();
    const region = getS3Region();

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

    const url = getPublicS3Url(key, bucket, region);

    return NextResponse.json({ url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload gagal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

