import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { normalizeVehicleModelName } from '@/lib/vehicle-model-images';
import {
  invalidAdminInputResponse,
  vehicleModelImageWriteSchema,
} from '@/lib/security/admin-schemas';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('VEHICLE_MODELS', 'view');

    const items = await prisma.vehicleModelImage.findMany({
      include: {
        media: {
          select: { id: true, filename: true, url: true },
        },
      },
      orderBy: [{ assetName: 'asc' }, { assetCode: 'asc' }],
    });

    return NextResponse.json({ items });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (
      message.includes('vehicle_model_images') ||
      message.includes('does not exist') ||
      message.includes('does not contain')
    ) {
      return NextResponse.json(
        { error: 'Tabel vehicle model images belum ada. Jalankan migration prisma terlebih dahulu.' },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('VEHICLE_MODELS', 'create');

    const body = await request.json();
    const parsed = vehicleModelImageWriteSchema.safeParse(body);
    if (!parsed.success) {
      return invalidAdminInputResponse(parsed.error);
    }

    const { assetCode, fullAssetCode, assetName, imageUrl, mediaId, isActive } = parsed.data;

    const item = await prisma.vehicleModelImage.create({
      data: {
        assetCode,
        fullAssetCode,
        assetName,
        normalizedAssetName: normalizeVehicleModelName(assetName),
        imageUrl,
        mediaId,
        isActive: isActive ?? true,
      },
      include: {
        media: {
          select: { id: true, filename: true, url: true },
        },
      },
    });

    return NextResponse.json({ item });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (
      error instanceof Error &&
      (error.message.includes('Unique constraint') || error.message.includes('vehicle_model_images_assetCode_key'))
    ) {
      return NextResponse.json({ error: 'Asset code sudah terdaftar. Gunakan edit untuk mengganti gambar.' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
