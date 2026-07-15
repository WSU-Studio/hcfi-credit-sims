import type { ProductCalculation } from '@/app/types/credit-simulation';

export type FirstInstallmentType = 'ADDM' | 'ADDB';

/** Hyundai `ListProductObj` often includes both ADDM and ADDB rows per tenor. */
export function deduplicateProductRowsByTenor(
  rows: ProductCalculation[]
): ProductCalculation[] {
  const byTenor = new Map<number, ProductCalculation>();
  for (const row of rows) {
    if (!byTenor.has(row.Tenor)) {
      byTenor.set(row.Tenor, row);
    }
  }
  return Array.from(byTenor.values()).sort((a, b) => a.Tenor - b.Tenor);
}

/**
 * Ambil opsi ADDM/ADDB yang benar-benar ada di response CalculateProductFromRule.
 * Urutan tetap ADDM lalu ADDB agar UI konsisten.
 */
export function getAvailableFirstInstallments(
  rows: ProductCalculation[]
): FirstInstallmentType[] {
  const set = new Set<FirstInstallmentType>();
  for (const row of rows) {
    const v = String(row.FirstInstallment ?? '').toUpperCase();
    if (v === 'ADDM' || v === 'ADDB') set.add(v);
  }
  return (['ADDM', 'ADDB'] as const).filter((opt) => set.has(opt));
}

export function normalizeFirstInstallment(
  raw: string | null | undefined
): FirstInstallmentType | null {
  const v = String(raw ?? '').toUpperCase();
  if (v === 'ADDM' || v === 'ADDB') return v;
  return null;
}

/**
 * Pilih firstInstallment yang valid terhadap opsi available.
 * Prefer preferred bila ada; kalau tidak, ambil opsi pertama yang tersedia.
 */
export function pickAllowedFirstInstallment(
  available: FirstInstallmentType[],
  preferred?: FirstInstallmentType | null
): FirstInstallmentType | null {
  if (available.length === 0) return null;
  if (preferred && available.includes(preferred)) return preferred;
  return available[0];
}

export function filterProductRowsByFirstInstallment(
  rows: ProductCalculation[],
  firstInstallment: FirstInstallmentType
): ProductCalculation[] {
  const normalized = firstInstallment.toUpperCase();
  const matched = rows.filter(
    (row) => String(row.FirstInstallment ?? '').toUpperCase() === normalized
  );
  // Jangan fallback ke semua tenor bila FirstInstallment tidak cocok —
  // itu yang membuat UI seolah ADDM padahal row-nya ADDB-only (atau sebaliknya).
  if (matched.length > 0) {
    return [...matched].sort((a, b) => a.Tenor - b.Tenor);
  }
  // Legacy: response tanpa field FirstInstallment sama sekali → dedupe tenor.
  const hasAnyFirstInstallment = rows.some(
    (row) => String(row.FirstInstallment ?? '').trim().length > 0
  );
  if (!hasAnyFirstInstallment) {
    return deduplicateProductRowsByTenor(rows);
  }
  return [];
}
