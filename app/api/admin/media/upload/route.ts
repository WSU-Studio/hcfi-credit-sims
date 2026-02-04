import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cloudinary = require('cloudinary').v2;

function uploadBufferToCloudinary(
  buffer: Buffer,
  options: { folder?: string }
): Promise<{ secure_url: string; public_id: string; format?: string; bytes?: number; width?: number; height?: number; original_filename?: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { folder: options.folder ?? 'hcfi_media' },
      (err: Error | undefined, result: any) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('MEDIA', 'create');

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error:
            'Set di .env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (tanpa NEXT_PUBLIC)',
        },
        { status: 400 }
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'File wajib diisi' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadBufferToCloudinary(buffer, { folder: 'hcfi_media' });

    const filename = result.original_filename ?? file.name ?? result.public_id?.split('/').pop() ?? 'image';
    const media = await prisma.media.create({
      data: {
        filename,
        url: result.secure_url,
        cloudinaryId: result.public_id,
        mimeType: result.format ?? file.type ?? null,
        size: result.bytes ?? null,
        width: result.width ?? null,
        height: result.height ?? null,
      },
    });

    return NextResponse.json({ media });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload gagal';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
