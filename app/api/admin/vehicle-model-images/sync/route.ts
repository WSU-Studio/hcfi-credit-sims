import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import type { AssetMaster } from '@/app/types/credit-simulation';
import { normalizeVehicleModelName } from '@/lib/vehicle-model-images';
import { adminSyncLimiter, tooManyRequestsResponse } from '@/lib/ratelimit';

type AssetsResponse = {
  ListAssetMasterObj?: AssetMaster[];
  error?: string;
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = adminSyncLimiter.limit(`vehicle-images:${session.user.id}`);
    if (!rl.success) {
      return tooManyRequestsResponse(
        'Sync hanya boleh dijalankan beberapa kali per jam.',
        rl.retryAfterSec
      );
    }

    await requirePermission('VEHICLE_MODELS', 'create');

    const assetResponse = await fetch(`${request.nextUrl.origin}/api/simulation/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        DealerCode: '',
        GetLatestAsset: true,
        GlobalCatalog: true,
      }),
      cache: 'no-store',
    });

    const data = (await assetResponse.json()) as AssetsResponse;
    if (!assetResponse.ok) {
      return NextResponse.json({ error: data.error || 'Gagal mengambil model dari API' }, { status: 502 });
    }

    const assets = Array.isArray(data.ListAssetMasterObj) ? data.ListAssetMasterObj : [];
    if (assets.length === 0) {
      return NextResponse.json({ synced: 0, total: 0 });
    }

    let synced = 0;
    for (const asset of assets) {
      await prisma.vehicleModelImage.upsert({
        where: { assetCode: asset.AssetCode },
        update: {
          fullAssetCode: asset.FullAssetCode || null,
          assetName: asset.AssetName || null,
          normalizedAssetName: normalizeVehicleModelName(asset.AssetName),
        },
        create: {
          assetCode: asset.AssetCode,
          fullAssetCode: asset.FullAssetCode || null,
          assetName: asset.AssetName || null,
          normalizedAssetName: normalizeVehicleModelName(asset.AssetName),
          imageUrl: '',
          mediaId: null,
          isActive: false,
        },
      });
      synced += 1;
    }

    return NextResponse.json({ synced, total: assets.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
