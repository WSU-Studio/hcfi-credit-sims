import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { validateImageFile } from '@/lib/image-utils';
import { getPublicS3Url, getS3Bucket, getS3Client, getS3Region } from '@/lib/s3-client';

const FOLDER = 'hcfi_media';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('MEDIA', 'create');

    const bucket = getS3Bucket();
    const region = getS3Region();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'File wajib diisi' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const validation = validateImageFile(inputBuffer);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const webpBuffer = await sharp(inputBuffer)
      .webp({ quality: 85 })
      .toBuffer();

    const metadata = await sharp(webpBuffer).metadata();
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

    const media = await prisma.media.create({
      data: {
        filename: file.name,
        url,
        cloudinaryId: key,
        mimeType: 'image/webp',
        size: webpBuffer.length,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
      },
    });

    return NextResponse.json({ media });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload gagal';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
