import { hyundaiPost } from '@/lib/hyundai-api-post';
import { integrationRequestBody } from '@/lib/hyundai-integration-request';
import { resolveHyundaiProductFromSimulation } from '@/lib/hyundai-product-map';

export type HyundaiDefaultProduct = {
  ProductCode: string;
  ProductName: string;
  DPPrcnt: number;
  Tenor: number;
  Default?: boolean;
};

type ProductsByLeadResponse = {
  ListDefaultStandardProductObj?: HyundaiDefaultProduct[];
  ListDefaultPromotionProductObj?: HyundaiDefaultProduct[];
};

type ProductNameRow = {
  ProductName?: string;
  MrInstSchemeCode?: string;
  DPPrcnt?: number;
};

type ProductNameByLeadResponse = {
  ListDefaultStandardProductObj?: ProductNameRow[];
  ListDefaultPromotionProductObj?: ProductNameRow[];
};

type FinalCalculateResponse = {
  SummaryInfoObj?: Record<string, unknown>;
  SaveLeadDataObj?: Record<string, unknown>;
  SaveLeadFinDataObj?: Record<string, unknown>;
  ListSaveLeadInstSchdlObj?: Record<string, unknown>[];
};

function parseProductNameHint(productName: string | null | undefined): string {
  if (!productName) return '';
  const match = productName.match(/^(.+?)\s*-\s*Tenor\s*\d+/i);
  return (match?.[1] ?? productName).trim();
}

function isRetryableProductFetchError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    msg.includes('lead asset not found') ||
    msg.includes('linq query parameter') ||
    msg.includes('exception has been occured')
  );
}

function pickSimulationProduct(
  products: HyundaiDefaultProduct[],
  params: { dpPercent: number; tenor: number; productName?: string | null }
): HyundaiDefaultProduct {
  const hint = parseProductNameHint(params.productName).toLowerCase();

  const exact = products.find(
    (p) =>
      Number(p.Tenor) === params.tenor &&
      Math.abs(Number(p.DPPrcnt) - params.dpPercent) < 0.01
  );
  if (exact) return exact;

  const byTenor = products.filter((p) => Number(p.Tenor) === params.tenor);
  if (byTenor.length === 1) return byTenor[0];

  const byDp = products.filter(
    (p) => Math.abs(Number(p.DPPrcnt) - params.dpPercent) < 0.01
  );
  if (byDp.length === 1) {
    return { ...byDp[0], Tenor: params.tenor };
  }

  if (hint) {
    const mapped = resolveHyundaiProductFromSimulation({
      productName: params.productName,
      dpPercent: params.dpPercent,
      tenor: params.tenor,
    });
    const byHyundaiName = products.find((p) =>
      p.ProductName?.toLowerCase().includes(mapped.productName.toLowerCase().slice(0, 12))
    );
    if (byHyundaiName) return { ...byHyundaiName, Tenor: params.tenor };
  }

  const defaulted = products.find((p) => p.Default);
  if (defaulted) return { ...defaulted, Tenor: params.tenor };

  const fallbackTenor = byTenor[0] ?? byDp[0] ?? products[0];
  if (!fallbackTenor) {
    throw new Error('Produk simulasi kredit tidak ditemukan di Hyundai untuk lead ini.');
  }
  return { ...fallbackTenor, Tenor: params.tenor };
}

function mapNameRowsToProducts(
  rows: ProductNameRow[],
  tenor: number
): HyundaiDefaultProduct[] {
  return rows
    .filter((row) => row.ProductName?.trim())
    .map((row) => ({
      ProductCode: row.MrInstSchemeCode?.trim() || 'RF',
      ProductName: String(row.ProductName).trim(),
      DPPrcnt: Number(row.DPPrcnt) || 0,
      Tenor: tenor,
    }));
}

function productFromSimulationFallback(params: {
  dpPercent: number;
  tenor: number;
  productName?: string | null;
}): HyundaiDefaultProduct {
  const mapped = resolveHyundaiProductFromSimulation(params);
  return {
    ProductCode: mapped.productCode,
    ProductName: mapped.productName,
    DPPrcnt: mapped.dpPercent,
    Tenor: params.tenor,
  };
}

async function fetchDefaultProductsByName(
  leadNo: string,
  tenor: number
): Promise<ProductsByLeadResponse> {
  const data = await hyundaiPost<ProductNameByLeadResponse>(
    '/v1/IntegrationWebsite/GetListDefaultProductNameFromRuleByLeadNo',
    { LeadNo: leadNo }
  );

  return {
    ListDefaultStandardProductObj: mapNameRowsToProducts(
      data.ListDefaultStandardProductObj ?? [],
      tenor
    ),
    ListDefaultPromotionProductObj: mapNameRowsToProducts(
      data.ListDefaultPromotionProductObj ?? [],
      tenor
    ),
  };
}

async function fetchDefaultProducts(
  leadNo: string,
  tenor: number
): Promise<ProductsByLeadResponse> {
  const attempts: Array<{ path: string; body: Record<string, unknown> }> = [
    {
      path: '/v2/LeadFinData/GetListDefaultProductFromRuleByLeadNo',
      body: { LeadNo: leadNo },
    },
    {
      path: '/v1/IntegrationWebsite/GetListDefaultProductFromRuleByLeadNo',
      body: { LeadNo: leadNo },
    },
    {
      path: '/v1/IntegrationWebsite/GetListDefaultProductFromRuleByLeadNo',
      body: integrationRequestBody({ LeadNo: leadNo }),
    },
    {
      path: '/v1/IntegrationWebsite/GetListDefaultProductFromRuleByLeadNo',
      body: integrationRequestBody({ leadNo }),
    },
  ];

  let lastError: unknown;
  for (const { path, body } of attempts) {
    try {
      const result = await hyundaiPost<ProductsByLeadResponse>(path, body);
      const count =
        (result.ListDefaultStandardProductObj?.length ?? 0) +
        (result.ListDefaultPromotionProductObj?.length ?? 0);
      if (count > 0) return result;
    } catch (error) {
      lastError = error;
      if (!isRetryableProductFetchError(error)) throw error;
    }
  }

  try {
    const byName = await fetchDefaultProductsByName(leadNo, tenor);
    const count =
      (byName.ListDefaultStandardProductObj?.length ?? 0) +
      (byName.ListDefaultPromotionProductObj?.length ?? 0);
    if (count > 0) return byName;
  } catch (nameError) {
    lastError = nameError;
  }

  if (lastError instanceof Error) {
    console.warn(
      '[hyundai-lead-financial] Product list APIs failed or empty; using simulation mapping.',
      lastError.message
    );
  }

  return {
    ListDefaultStandardProductObj: [],
    ListDefaultPromotionProductObj: [],
  };
}

/**
 * Postman Fase 2: product rule + calculate + final calculate + save.
 * When Hyundai returns no product list (common for some dealers), we map from simulation data.
 */
export async function bootstrapLeadFinancialAndInsurance(params: {
  leadNo: string;
  otrPrice: number;
  dpPercent: number;
  tenor: number;
  productName?: string | null;
}): Promise<void> {
  const productsRes = await fetchDefaultProducts(params.leadNo, params.tenor);

  const products = [
    ...(productsRes.ListDefaultStandardProductObj ?? []),
    ...(productsRes.ListDefaultPromotionProductObj ?? []),
  ];

  const product =
    products.length > 0
      ? pickSimulationProduct(products, {
          dpPercent: params.dpPercent,
          tenor: params.tenor,
          productName: params.productName,
        })
      : productFromSimulationFallback({
          dpPercent: params.dpPercent,
          tenor: params.tenor,
          productName: params.productName,
        });

  const dpAmt = Math.round(params.otrPrice * (params.dpPercent / 100));

  try {
    await hyundaiPost(
      '/v1/IntegrationWebsite/CalculateProductFromRule',
      integrationRequestBody({
        LeadNo: params.leadNo,
        DpPrcnt: params.dpPercent,
        DpAmt: dpAmt,
        ProductCode: product.ProductCode,
        ProductName: product.ProductName,
        IsPromotion: false,
      })
    );
  } catch (calcError) {
    const detail = calcError instanceof Error ? calcError.message : String(calcError);
    throw new Error(
      `Gagal menghitung produk kredit di Hyundai (${product.ProductName}, DP ${params.dpPercent}%). ` +
        `Dealer/aset mungkin belum punya rule produk ini. Detail: ${detail}`
    );
  }

  const finalRes = await hyundaiPost<FinalCalculateResponse>(
    '/v1/IntegrationWebsite/FinalCalculateByLeadNo',
    integrationRequestBody({ LeadNo: params.leadNo })
  );

  if (!finalRes.SummaryInfoObj) {
    throw new Error('FinalCalculateByLeadNo tidak mengembalikan data kalkulasi.');
  }

  await hyundaiPost(
    '/v1/IntegrationWebsite/SaveFinalCalculateResult',
    integrationRequestBody({
      SummaryInfoObj: finalRes.SummaryInfoObj,
      SaveLeadDataObj: finalRes.SaveLeadDataObj ?? { NumOfInst: params.tenor },
      SaveLeadFinDataObj: finalRes.SaveLeadFinDataObj ?? {},
      ListSaveLeadInstSchdlObj: finalRes.ListSaveLeadInstSchdlObj ?? [],
    })
  );
}
