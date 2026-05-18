/**
 * Maps website simulation product labels to Hyundai LOS product names (Postman Fase 2).
 * UI uses "Product DP Ringan"; Hyundai expects "Loan Low DP", etc.
 */

export type HyundaiLosProduct = {
  productCode: string;
  productName: string;
  dpPercent: number;
};

const BY_SIMULATION_LABEL: Array<{
  test: (name: string) => boolean;
  product: HyundaiLosProduct;
}> = [
  {
    test: (n) => /dp\s*ringan|product\s*dp/i.test(n),
    product: { productCode: 'RF', productName: 'Loan Low DP', dpPercent: 10 },
  },
  {
    test: (n) => /bunga\s*murah|low\s*interest/i.test(n),
    product: { productCode: 'RF', productName: 'Loan Low Interest', dpPercent: 20 },
  },
  {
    test: (n) => /special|promo/i.test(n),
    product: { productCode: 'RF', productName: 'Loan Special Offers', dpPercent: 35 },
  },
  {
    test: (n) => /balloon/i.test(n) && !/lease/i.test(n),
    product: { productCode: 'BL', productName: 'Standard Loan Balloon', dpPercent: 20 },
  },
  {
    test: (n) => /5050|50:50|50\s*\/\s*50/i.test(n),
    product: { productCode: '50:50', productName: 'Loan 5050', dpPercent: 50 },
  },
  {
    test: (n) => /lease.*low\s*dp/i.test(n),
    product: { productCode: 'RF', productName: 'Lease Low DP', dpPercent: 10 },
  },
];

function parseSimulationProductLabel(productName: string | null | undefined): string {
  if (!productName) return '';
  const match = productName.match(/^(.+?)\s*-\s*Tenor\s*\d+/i);
  return (match?.[1] ?? productName).trim().toLowerCase();
}

/** Resolve Hyundai LOS product from data saved at simulation time. */
export function resolveHyundaiProductFromSimulation(params: {
  productName?: string | null;
  dpPercent: number;
  tenor: number;
}): HyundaiLosProduct {
  const label = parseSimulationProductLabel(params.productName);

  for (const entry of BY_SIMULATION_LABEL) {
    if (label && entry.test(label)) {
      return { ...entry.product, dpPercent: params.dpPercent || entry.product.dpPercent };
    }
  }

  if (params.dpPercent >= 45) {
    return { productCode: '50:50', productName: 'Loan 5050', dpPercent: params.dpPercent };
  }
  if (params.dpPercent >= 30) {
    return { productCode: 'RF', productName: 'Loan Special Offers', dpPercent: params.dpPercent };
  }
  if (params.dpPercent >= 15) {
    return { productCode: 'RF', productName: 'Loan Low Interest', dpPercent: params.dpPercent };
  }
  return { productCode: 'RF', productName: 'Loan Low DP', dpPercent: params.dpPercent };
}
