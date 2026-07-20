import { NextRequest, NextResponse } from 'next/server';
import { resolveVehicleModelImage } from '@/lib/vehicle-model-images';
import { getClientIp, simulationLimiter, tooManyRequestsResponse } from '@/lib/ratelimit';
import {
  invalidInputResponse,
  vehicleImageQuerySchema,
} from '@/lib/security/simulation-schemas';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = simulationLimiter.limit(ip);
  if (!rl.success) {
    return tooManyRequestsResponse(
      'Terlalu banyak permintaan. Silakan coba lagi sebentar.',
      rl.retryAfterSec
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const parsed = vehicleImageQuerySchema.safeParse({
      assetCode: searchParams.get('assetCode') ?? undefined,
      fullAssetCode: searchParams.get('fullAssetCode') ?? undefined,
      assetName: searchParams.get('assetName') ?? undefined,
    });
    if (!parsed.success) {
      return invalidInputResponse(parsed.error);
    }

    const { assetCode, fullAssetCode, assetName } = parsed.data;
    const imageUrl = await resolveVehicleModelImage({
      assetCode: assetCode || null,
      fullAssetCode: fullAssetCode || null,
      assetName: assetName || null,
    });

    return NextResponse.json({ imageUrl });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: 'Failed to resolve vehicle image',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
