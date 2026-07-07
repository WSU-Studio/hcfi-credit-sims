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

export function filterProductRowsByFirstInstallment(
  rows: ProductCalculation[],
  firstInstallment: FirstInstallmentType
): ProductCalculation[] {
  const normalized = firstInstallment.toUpperCase();
  const matched = rows.filter(
    (row) => String(row.FirstInstallment ?? 'ADDM').toUpperCase() === normalized
  );
  if (matched.length > 0) {
    return [...matched].sort((a, b) => a.Tenor - b.Tenor);
  }
  return deduplicateProductRowsByTenor(rows);
}
