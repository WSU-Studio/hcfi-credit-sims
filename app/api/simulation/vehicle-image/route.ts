import { NextRequest, NextResponse } from 'next/server';
import { resolveVehicleModelImage } from '@/lib/vehicle-model-images';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const assetCode = searchParams.get('assetCode');
    const fullAssetCode = searchParams.get('fullAssetCode');
    const assetName = searchParams.get('assetName');

    const imageUrl = await resolveVehicleModelImage({
      assetCode,
      fullAssetCode,
      assetName,
    });

    return NextResponse.json({ imageUrl });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to resolve vehicle image', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
