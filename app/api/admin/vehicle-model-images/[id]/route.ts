import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { normalizeVehicleModelName } from '@/lib/vehicle-model-images';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('VEHICLE_MODELS', 'edit');

    const { id } = await params;
    const body = await request.json();
    const assetCode = String(body.assetCode || '').trim();
    const fullAssetCode = String(body.fullAssetCode || '').trim() || null;
    const assetName = String(body.assetName || '').trim() || null;
    const imageUrl = String(body.imageUrl || '').trim();
    const mediaId = String(body.mediaId || '').trim() || null;
    const isActive = Boolean(body.isActive ?? true);

    if (!assetCode || !imageUrl) {
      return NextResponse.json({ error: 'assetCode dan imageUrl wajib diisi' }, { status: 400 });
    }

    const item = await prisma.vehicleModelImage.update({
      where: { id },
      data: {
        assetCode,
        fullAssetCode,
        assetName,
        normalizedAssetName: normalizeVehicleModelName(assetName),
        imageUrl,
        mediaId,
        isActive,
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
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }
    if (
      error instanceof Error &&
      (error.message.includes('Unique constraint') || error.message.includes('vehicle_model_images_assetCode_key'))
    ) {
      return NextResponse.json({ error: 'Asset code sudah dipakai model lain.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission('VEHICLE_MODELS', 'delete');

    const { id } = await params;
    await prisma.vehicleModelImage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
