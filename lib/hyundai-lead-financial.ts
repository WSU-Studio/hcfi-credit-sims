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

/**
 * Row dalam `ListProductObj` dari `SimulateFinancialCalculate`.
 * Field di response sudah lengkap untuk dipakai sebagai payload `SaveFinancialData`
 * (kecuali wrapper LeadNo/dpAmt/dpPrcnt/isPromotion yang kita inject di luar).
 */
type SimulateFinancialRow = Record<string, unknown> & {
  ProductCode?: string;
  ProductName?: string;
  Tenor?: number;
  FirstInstallment?: string;
};

type SimulateFinancialResponse = {
  ListProductObj?: SimulateFinancialRow[];
};

const HYUNDAI_CHANNEL_CODE = 'WEBSITE';

function pickSimulateRowForTenor(
  rows: SimulateFinancialRow[],
  tenor: number
): SimulateFinancialRow | null {
  if (!rows.length) return null;
  const exact = rows.find((r) => Number(r.Tenor) === tenor);
  return exact ?? rows[0];
}

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
 * Postman Fase 2 — chain finansial lengkap (5 step):
 *   1. CalculateProductFromRule  — priming rule produk
 *   2. SimulateFinancialCalculate — kalkulasi detail tenor terpilih
 *      (wajib `MrChannelCode: "WEBSITE"`, `FirstInstallment`, `Tenor` —
 *      tanpa `MrChannelCode` Hyundai balas HTTP 500 LINQ exception per
 *      konfirmasi tim Hyundai 2026-06-03; field belum ada di Postman v1.1)
 *   3. SaveFinancialData         — commit pilihan finansial user
 *   4. FinalCalculateByLeadNo    — final compute
 *   5. SaveFinalCalculateResult  — persist ke Adins
 *
 * Saat Hyundai tidak return produk default (common di sebagian dealer), kita
 * fallback ke mapping dari simulation product (`productFromSimulationFallback`).
 */
export async function bootstrapLeadFinancialAndInsurance(params: {
  leadNo: string;
  otrPrice: number;
  dpPercent: number;
  tenor: number;
  productName?: string | null;
  firstInstallment?: 'ADDM' | 'ADDB';
  isPromotion?: boolean;
  mrChannelCode?: string;
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
  const firstInstallment: 'ADDM' | 'ADDB' = params.firstInstallment ?? 'ADDM';
  const isPromotion = Boolean(params.isPromotion);
  const channelCode = params.mrChannelCode || HYUNDAI_CHANNEL_CODE;

  // Step 1 — priming rule produk untuk Hyundai DB.
  try {
    await hyundaiPost(
      '/v1/IntegrationWebsite/CalculateProductFromRule',
      integrationRequestBody({
        LeadNo: params.leadNo,
        DpPrcnt: params.dpPercent,
        DpAmt: dpAmt,
        ProductCode: product.ProductCode,
        ProductName: product.ProductName,
        IsPromotion: isPromotion,
      })
    );
  } catch (calcError) {
    const detail = calcError instanceof Error ? calcError.message : String(calcError);
    throw new Error(
      `Gagal menghitung produk kredit di Hyundai (${product.ProductName}, DP ${params.dpPercent}%). ` +
        `Dealer/aset mungkin belum punya rule produk ini. Detail: ${detail}`
    );
  }

  // Step 2 — simulate detail untuk tenor yang dipilih user.
  const simulateRes = await hyundaiPost<SimulateFinancialResponse>(
    '/v1/IntegrationWebsite/SimulateFinancialCalculate',
    integrationRequestBody({
      LeadNo: params.leadNo,
      DpPrcnt: params.dpPercent,
      DpAmt: dpAmt,
      ProductCode: product.ProductCode,
      ProductName: product.ProductName,
      IsPromotion: isPromotion,
      FirstInstallment: firstInstallment,
      Tenor: params.tenor,
      MrChannelCode: channelCode,
    })
  );

  const simulateRow = pickSimulateRowForTenor(
    simulateRes.ListProductObj ?? [],
    params.tenor
  );
  if (!simulateRow) {
    throw new Error(
      `SimulateFinancialCalculate tidak mengembalikan baris untuk tenor ${params.tenor} ` +
        `(produk ${product.ProductName}). Cek dealer/asset rule di Hyundai.`
    );
  }

  // Step 3 — commit pilihan ke Hyundai. Body = wrapper camelCase + spread row
  // dari simulate (PascalCase). Hyundai menerima campuran ini per Postman v1.1.
  await hyundaiPost(
    '/v1/IntegrationWebsite/SaveFinancialData',
    integrationRequestBody({
      LeadNo: params.leadNo,
      dpAmt,
      dpPrcnt: params.dpPercent,
      isPromotion,
      ...simulateRow,
    })
  );

  // Step 4 — final compute.
  const finalRes = await hyundaiPost<FinalCalculateResponse>(
    '/v1/IntegrationWebsite/FinalCalculateByLeadNo',
    integrationRequestBody({ LeadNo: params.leadNo })
  );

  if (!finalRes.SummaryInfoObj) {
    throw new Error('FinalCalculateByLeadNo tidak mengembalikan data kalkulasi.');
  }

  // Step 5 — persist ke Adins.
  //
  // PENTING (2026-06-03): body request `SaveFinalCalculateResult` di Postman
  // v1.1 adalah PERSIS seluruh response `FinalCalculateByLeadNo` (termasuk
  // HeaderObj, StatusCode, dst) DITAMBAH `LeadNo` di paling atas. Kalau LeadNo
  // tidak dikirim, Hyundai-side LINQ query lempar:
  //   "An exception was thrown while attempting to evaluate a LINQ query
  //    parameter expression"
  // Pola yang sama dengan SimulateFinancialCalculate sebelum kita tambah
  // MrChannelCode. Maka kita forward `finalRes` apa adanya + inject LeadNo.
  await hyundaiPost(
    '/v1/IntegrationWebsite/SaveFinalCalculateResult',
    integrationRequestBody({
      LeadNo: params.leadNo,
      ...(finalRes as Record<string, unknown>),
      SummaryInfoObj: finalRes.SummaryInfoObj,
      SaveLeadDataObj: finalRes.SaveLeadDataObj ?? { NumOfInst: params.tenor },
      SaveLeadFinDataObj: finalRes.SaveLeadFinDataObj ?? {},
      ListSaveLeadInstSchdlObj: finalRes.ListSaveLeadInstSchdlObj ?? [],
    })
  );
}
