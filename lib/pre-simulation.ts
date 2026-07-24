import type { FinalSummaryInfo, Vendor } from '@/app/types/credit-simulation';
import type { LeadAssetSnapshot } from '@/lib/lead-asset-snapshot';

export type PreSimulationSavePayload = {
  title: string;
  slug: string;
  isPublished?: boolean;
  vendor: Vendor;
  modelCode: string;
  modelName: string;
  manufacturingYear?: number | null;
  fscCode?: string | null;
  trimName?: string | null;
  exteriorColorCode?: string | null;
  exteriorColorName?: string | null;
  interiorColorCode?: string | null;
  interiorColorName?: string | null;
  vehicleSummary?: string | null;
  assetSnapshot?: LeadAssetSnapshot | null;
  otrPrice: number;
  discount?: number | null;
  partnerCode?: string | null;
  simulationLeadNo?: string | null;
  productCode: string;
  productName: string;
  dpPercent: number;
  tenor: number;
  firstInstallment: 'ADDM' | 'ADDB';
  isPromotion?: boolean;
  summarySnapshot: FinalSummaryInfo;
};

export function slugifyPreSimulationTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function buildPreSimulationPublicPath(slug: string, locale = 'id'): string {
  return `/${locale}/pre-sim/${encodeURIComponent(slug)}`;
}
