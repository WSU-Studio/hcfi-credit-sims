import { prisma } from '@/lib/prisma';

export function normalizeVehicleModelName(value?: string | null): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

type ResolveVehicleImageInput = {
  assetCode?: string | null;
  fullAssetCode?: string | null;
  assetName?: string | null;
};

export async function resolveVehicleModelImage(input: ResolveVehicleImageInput): Promise<string | null> {
  const assetCode = input.assetCode?.trim();
  const fullAssetCode = input.fullAssetCode?.trim();
  const assetName = input.assetName?.trim();
  const normalizedAssetName = normalizeVehicleModelName(assetName);

  if (assetCode) {
    const byAssetCode = await prisma.vehicleModelImage.findUnique({
      where: { assetCode },
      select: { imageUrl: true, isActive: true },
    });
    if (byAssetCode?.isActive && byAssetCode.imageUrl?.trim()) return byAssetCode.imageUrl;
  }

  if (fullAssetCode) {
    const byFullAssetCode = await prisma.vehicleModelImage.findFirst({
      where: { fullAssetCode, isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: { imageUrl: true },
    });
    if (byFullAssetCode?.imageUrl?.trim()) return byFullAssetCode.imageUrl;
  }

  if (normalizedAssetName) {
    const byNormalizedName = await prisma.vehicleModelImage.findFirst({
      where: { normalizedAssetName, isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: { imageUrl: true },
    });
    if (byNormalizedName?.imageUrl?.trim()) return byNormalizedName.imageUrl;
  }

  return null;
}
