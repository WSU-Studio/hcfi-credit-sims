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

/** Empty OEM accessory lists — website tidak punya input aksesori (konfirmasi Pak Richard 2026-07). */
export const EMPTY_OEM_ACCESSORIES: ResolvedOemAccessories = {
  codes: [],
  list: [],
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

/**
 * Aksesori untuk AddLeadAsset.
 * Selalu kosong `[]` — user tidak memilih aksesori di form simulasi;
 * Richard Fam konfirmasi list kosong diizinkan di AddLeadAsset.
 */
export async function resolveDefaultOemAccessories(
  _modelCode: string
): Promise<ResolvedOemAccessories> {
  return EMPTY_OEM_ACCESSORIES;
}
