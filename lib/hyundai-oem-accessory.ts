import { hyundaiPost } from '@/lib/hyundai-api-post';

export type OemAccessoryItem = {
  code: string;
  name: string;
  priceAmt: number;
};

type ProductByModelRow = {
  Key?: string;
  Value?: string;
  Price?: number;
};

export type ResolvedOemAccessories = {
  codes: string[];
  list: { mrAssetOemAccessoryCode: string; assetOemAccessoryPriceAmt: number }[];
};

export async function fetchOemAccessories(modelCode: string): Promise<OemAccessoryItem[]> {
  const data = await hyundaiPost<{ ReturnObject?: ProductByModelRow[] }>(
    '/Foundation/v1/AssetMasterForMobileX/GetListProductByModel',
    {
      MrAssetMasterProductTypeCode: 'ACCESSORY',
      ModelCode: modelCode,
    }
  );

  return (data.ReturnObject ?? [])
    .filter((row) => row.Key?.trim())
    .map((row) => ({
      code: String(row.Key).trim(),
      name: String(row.Value ?? '').trim(),
      priceAmt: Number(row.Price) || 0,
    }));
}

/** Hyundai AddLeadAsset requires at least one OEM accessory to initialize lead insurance. */
export async function resolveDefaultOemAccessories(
  modelCode: string
): Promise<ResolvedOemAccessories> {
  const items = await fetchOemAccessories(modelCode);
  if (items.length === 0) {
    throw new Error(
      `Aksesori OEM tidak ditemukan untuk model ${modelCode}. Submit ke Hyundai tidak dapat dilanjutkan.`
    );
  }

  const withPrice = items.find((i) => i.priceAmt > 0);
  const chosen = withPrice ?? items[0];

  return {
    codes: [chosen.code],
    list: [
      {
        mrAssetOemAccessoryCode: chosen.code,
        assetOemAccessoryPriceAmt: chosen.priceAmt,
      },
    ],
  };
}
