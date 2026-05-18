/** Asset codes captured at simulation submit — used for Hyundai AddLeadAsset */
export type LeadAssetSnapshot = {
  modelCode: string;
  modelName: string;
  manufacturingYear: number;
  fscCode: string;
  trimName: string;
  exteriorColorCode: string;
  exteriorColorName: string;
  interiorColorCode: string;
  interiorColorName: string;
};

export function parseLeadAssetSnapshot(raw: unknown): LeadAssetSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const modelCode = String(o.modelCode ?? '').trim();
  const fscCode = String(o.fscCode ?? '').trim();
  const manufacturingYear = Number(o.manufacturingYear);
  if (!modelCode || !fscCode || !manufacturingYear) return null;
  return {
    modelCode,
    modelName: String(o.modelName ?? '').trim(),
    manufacturingYear,
    fscCode,
    trimName: String(o.trimName ?? '').trim(),
    exteriorColorCode: String(o.exteriorColorCode ?? '').trim(),
    exteriorColorName: String(o.exteriorColorName ?? '').trim(),
    interiorColorCode: String(o.interiorColorCode ?? '').trim(),
    interiorColorName: String(o.interiorColorName ?? '').trim(),
  };
}
