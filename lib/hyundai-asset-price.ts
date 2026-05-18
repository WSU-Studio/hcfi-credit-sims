import { hyundaiPost } from '@/lib/hyundai-api-post';
import { integrationRequestBody } from '@/lib/hyundai-integration-request';
import type { ResolvedLeadAsset } from '@/lib/hyundai-asset-resolve';
import type { ResolvedOemAccessories } from '@/lib/hyundai-oem-accessory';

export async function resolveAssetPriceAmt(params: {
  asset: ResolvedLeadAsset;
  dealerCode: string;
  oem: ResolvedOemAccessories;
  fallbackOtr: number;
}): Promise<number> {
  try {
    const data = await hyundaiPost<{ ReturnObject?: number }>(
      '/Foundation/v2/OEMX/GetAssetMasterPriceByAssetName',
      {
        AssetCode: params.asset.modelCode,
        TrimCode: params.asset.fscCode,
        ExteriorCode: params.asset.exteriorColorCode,
        InteriorCode: params.asset.interiorColorCode,
        DealerCode: params.dealerCode,
        ManufacturingYear: String(params.asset.manufacturingYear),
        AssetName: params.asset.trimName || params.asset.modelName,
      }
    );
    const base = Number(data.ReturnObject) || 0;
    if (base > 0) {
      return base;
    }
  } catch {
    // fall through to simulation OTR
  }

  const accessoryTotal = params.oem.list.reduce(
    (sum, item) => sum + (item.assetOemAccessoryPriceAmt || 0),
    0
  );
  if (params.fallbackOtr > accessoryTotal) {
    return params.fallbackOtr - accessoryTotal;
  }
  return params.fallbackOtr > 0 ? params.fallbackOtr : 0;
}

export async function verifyLeadAssetExists(leadNo: string): Promise<void> {
  await hyundaiPost(
    '/v1/IntegrationWebsite/GetLeadAssetSummaryInfoByLeadNo',
    integrationRequestBody({ leadNo, LeadNo: leadNo })
  );
}
