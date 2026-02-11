/**
 * Mock API Service untuk Credit Simulation
 * Digunakan ketika VPN belum tersedia atau API real belum bisa diakses
 */

import type {
  ApiResponse,
  Vendor,
  AssetMaster,
  KeyValuePair,
  ProductCalculation,
  DefaultProduct,
} from '@/app/types/credit-simulation';

// Mock Data - Vendors/Dealers
const MOCK_VENDORS: Vendor[] = [
  {
    VendorCode: 'A11AD12406',
    VendorName: 'HYUNDAI TANGERANG CITY',
    ZipCode: '15118',
    City: 'TANGERANG',
    OriOfficeCode: '11',
    OriOfficeName: 'DKI JAKARTA',
  },
  {
    VendorCode: 'A11AD12404',
    VendorName: 'HYUNDAI JAKARTA SELATAN',
    ZipCode: '12120',
    City: 'JAKARTA SELATAN',
    OriOfficeCode: '11',
    OriOfficeName: 'DKI JAKARTA',
  },
  {
    VendorCode: 'A12AD60505',
    VendorName: 'HYUNDAI BANDUNG',
    ZipCode: '40111',
    City: 'BANDUNG',
    OriOfficeCode: '12',
    OriOfficeName: 'JAWA BARAT',
  },
  {
    VendorCode: 'A13AD60506',
    VendorName: 'HYUNDAI SURABAYA',
    ZipCode: '60264',
    City: 'SURABAYA',
    OriOfficeCode: '13',
    OriOfficeName: 'JAWA TIMUR',
  },
];

// Mock Data - Asset Masters (Models)
const MOCK_ASSET_MASTERS: AssetMaster[] = [
  {
    AssetCategoryName: 'SUV',
    AssetCode: '4U',
    AssetName: 'THE ALL NEW SANTA FE',
    Price: 724000000,
    FullAssetCode: 'HYUNDAI4U',
    ManufacturingYear: 2025,
  },
  {
    AssetCategoryName: 'SUV',
    AssetCode: '4V',
    AssetName: 'CRETA',
    Price: 389000000,
    FullAssetCode: 'HYUNDAI4V',
    ManufacturingYear: 2025,
  },
  {
    AssetCategoryName: 'MPV',
    AssetCode: '4S',
    AssetName: 'STARIA',
    Price: 549000000,
    FullAssetCode: 'HYUNDAI4S',
    ManufacturingYear: 2025,
  },
  {
    AssetCategoryName: 'SUV',
    AssetCode: '4T',
    AssetName: 'TUCSON',
    Price: 519000000,
    FullAssetCode: 'HYUNDAI4T',
    ManufacturingYear: 2025,
  },
  {
    AssetCategoryName: 'EV',
    AssetCode: '4E',
    AssetName: 'IONIQ 5',
    Price: 699000000,
    FullAssetCode: 'HYUNDAI4E',
    ManufacturingYear: 2025,
  },
];

// Mock Data - Manufacturing Years
const MOCK_MANUFACTURING_YEARS: KeyValuePair[] = [
  { Key: 2024, Value: '2024' },
  { Key: 2025, Value: '2025' },
];

// Mock Data - Variants/Trims (dibuat berdasarkan model)
const MOCK_VARIANTS: Record<string, KeyValuePair[]> = {
  '4U': [
    { Key: '4UW7D5G1FEV1GG004', Value: 'SANTA FE HEV PRIME' },
    { Key: '4UW6D5G1FEV1HH004', Value: 'SANTA FE HEV CALLIGRAPHY' },
    { Key: '4UW5D5G1FEV1II004', Value: 'SANTA FE GASOLINE PRIME' },
  ],
  '4V': [
    { Key: '4VW7D5G1FEV1GG004', Value: 'CRETA PRIME' },
    { Key: '4VW6D5G1FEV1HH004', Value: 'CRETA SIGNATURE' },
    { Key: '4VW5D5G1FEV1II004', Value: 'CRETA ADVENTURE' },
  ],
  '4S': [
    { Key: '4SW7D5G1FEV1GG004', Value: 'STARIA PREMIUM' },
    { Key: '4SW6D5G1FEV1HH004', Value: 'STARIA LUXURY' },
  ],
  '4T': [
    { Key: '4TW7D5G1FEV1GG004', Value: 'TUCSON PRIME' },
    { Key: '4TW6D5G1FEV1HH004', Value: 'TUCSON SIGNATURE' },
  ],
  '4E': [
    { Key: '4EW7D5G1FEV1GG004', Value: 'IONIQ 5 PREMIUM' },
    { Key: '4EW6D5G1FEV1HH004', Value: 'IONIQ 5 SIGNATURE' },
  ],
};

// Mock Data - Exterior Colors
const MOCK_EXTERIOR_COLORS: KeyValuePair[] = [
  { Key: 'NB9', Value: 'MIDNIGHT BLACK PEARL' },
  { Key: 'SWP', Value: 'SNOW WHITE PEARL' },
  { Key: 'ABY', Value: 'ABYSS BLACK' },
  { Key: 'SIL', Value: 'SILVER METALLIC' },
  { Key: 'GRY', Value: 'GRAY METALLIC' },
  { Key: 'BLU', Value: 'OCEAN BLUE' },
];

// Mock Data - Interior Colors
const MOCK_INTERIOR_COLORS: Record<string, KeyValuePair[]> = {
  NB9: [
    { Key: '4NB', Value: 'BLACK' },
    { Key: '4BE', Value: 'BEIGE' },
  ],
  SWP: [
    { Key: '4NB', Value: 'BLACK' },
    { Key: '4BE', Value: 'BEIGE' },
    { Key: '4GR', Value: 'GRAY' },
  ],
  ABY: [
    { Key: '4NB', Value: 'BLACK' },
  ],
  SIL: [
    { Key: '4NB', Value: 'BLACK' },
    { Key: '4GR', Value: 'GRAY' },
  ],
  GRY: [
    { Key: '4NB', Value: 'BLACK' },
    { Key: '4GR', Value: 'GRAY' },
  ],
  BLU: [
    { Key: '4NB', Value: 'BLACK' },
    { Key: '4BE', Value: 'BEIGE' },
  ],
};

// Mock Data - Sales Person
const MOCK_SALES_PERSONS: KeyValuePair[] = [
  { Key: 'HYUNDAI.TANGERANG.EMP.UDIN', Value: 'HYUNDAI TANGERANG EMP UDIN' },
  { Key: 'HYUNDAI.JAKARTA.EMP.SARI', Value: 'HYUNDAI JAKARTA EMP SARI' },
  { Key: 'HYUNDAI.BANDUNG.EMP.BUDI', Value: 'HYUNDAI BANDUNG EMP BUDI' },
];

// Product definitions aligned with Postman collection (GetListDefaultProductFromRuleByLeadNo)
const STANDARD_PRODUCTS = [
  { ProductCode: 'RF', ProductName: 'Product DP Ringan', defaultDP: 10, InstallmentSchemeCode: 'RF', effRate: 12, isBalloon: false, is5050: false },
  { ProductCode: 'RF', ProductName: 'Product Bunga Murah', defaultDP: 20, InstallmentSchemeCode: 'RF', effRate: 11, isBalloon: false, is5050: false },
  { ProductCode: 'BL', ProductName: 'Product Balloon', defaultDP: 20, InstallmentSchemeCode: 'BL', effRate: 10, isBalloon: true, is5050: false },
  { ProductCode: '50:50', ProductName: 'Product 5050', defaultDP: 50, InstallmentSchemeCode: '50:50', effRate: 8, isBalloon: false, is5050: true },
] as const;

const TENORS = [12, 24, 36, 48, 60] as const;
const ADMIN_FEE = 2000000;
const FIDUCIA_FEE = 1000000;
const PROVISION_PCT = 2;

function annuityInstallment(loan: number, annualRate: number, tenor: number): number {
  const m = annualRate / 12;
  return (loan * m * Math.pow(1 + m, tenor)) / (Math.pow(1 + m, tenor) - 1);
}

function buildProductRow(
  otrPrice: number,
  dpPct: number,
  tenor: number,
  product: (typeof STANDARD_PRODUCTS)[number],
  firstInstallment: 'ADDM' | 'ADDB',
  effRateOverride?: number
): ProductCalculation {
  const dpAmt = Math.round(otrPrice * (dpPct / 100));
  const loanAmount = otrPrice - dpAmt;
  const rate = effRateOverride ?? product.effRate;
  const inst = annuityInstallment(loanAmount, rate / 100, tenor);
  const prov = Math.round(loanAmount * (PROVISION_PCT / 100));

  let tdp = dpAmt + ADMIN_FEE + prov + FIDUCIA_FEE;
  if (firstInstallment === 'ADDM') {
    tdp += Math.round(inst); // first installment di muka
  }

  return {
    ProductCode: product.ProductCode,
    ProductName: product.ProductName,
    TdpAmt: tdp,
    InstallmentAmt: Math.round(inst),
    InstallmentSchemeCode: product.InstallmentSchemeCode,
    Default: tenor === 36 && firstInstallment === 'ADDB',
    DPPrcnt: dpPct,
    DPPrcntBhv: 'Min',
    Tenor: tenor,
    FirstInstallment: firstInstallment,
    EffRatePrcnt: rate,
    EffRateBhv: 'LOCK',
    BalloonAmt: product.isBalloon ? Math.round(loanAmount * 0.6) : 0,
    DefermentPeriod: 0,
    DefermentRatePrcnt: 0,
    AdminFeeAmt: ADMIN_FEE,
    AdminFeeCptlz: false,
    AdminFeeBhv: 'DEF',
    ProvisionType: 'PRCNT',
    ProvisionFee: PROVISION_PCT,
    ProvisionFeeCptlz: false,
    ProvisionFeeBhv: 'DEF',
    FiduciaFeeAmt: FIDUCIA_FEE,
    FiduciaFeeCptlz: false,
    FiduciaFeeBhv: 'LOCK_ALL',
  };
}

/** List default products for cards (Standard tab). Matches collection structure. */
function getListDefaultProductsForCards(otrPrice: number): ProductCalculation[] {
  return STANDARD_PRODUCTS.map((p, i) => {
    const tenor = p.is5050 ? 12 : 36;
    return buildProductRow(otrPrice, p.defaultDP, tenor, p, 'ADDB');
  }).map((r, i) => ({ ...r, Default: i === 0 }));
}

/**
 * CalculateProductFromRule-style: returns rows per tenor (and FirstInstallment).
 * ADDM vs ADDB: ADDM includes first installment in TDP.
 */
function computeProductRows(params: {
  otrPrice: number;
  dpPrcnt: number;
  productCode: string;
  productName: string;
  firstInstallment: 'ADDM' | 'ADDB';
}): ProductCalculation[] {
  const product = STANDARD_PRODUCTS.find(
    (p) => p.ProductName === params.productName && p.ProductCode === params.productCode
  );
  if (!product) {
    return [];
  }
  const tenors = product.is5050 ? ([12] as const) : TENORS;
  return tenors.map((t) =>
    buildProductRow(params.otrPrice, params.dpPrcnt, t, product, params.firstInstallment)
  );
}

/**
 * Mock API Functions
 */

export const mockApi = {
  /**
   * Get List Vendor & City
   */
  getVendorsAndCities(params: {
    hasAvailableAssetOnly?: boolean;
    hasCmoAssignedOnly?: boolean;
  }): ApiResponse<Vendor> {
    return {
      ReturnObject: MOCK_VENDORS,
      HeaderObj: {
        ResponseTime: '5 ms',
        StatusCode: '200',
        Message: 'Success',
        ErrorMessages: null,
      },
      StatusCode: '200',
      Message: 'Success',
      ErrorMessages: null,
      RowVersion: null,
    };
  },

  /**
   * Get List Vendor by Asset Code
   */
  getVendorsByAssetCode(params: { Code: string }): ApiResponse<KeyValuePair> {
    const vendors = MOCK_VENDORS.map((v) => ({
      Key: v.VendorCode,
      Value: v.VendorName,
    }));

    return {
      ReturnObject: vendors,
      HeaderObj: {
        ResponseTime: '4 ms',
        StatusCode: '200',
        Message: 'Success',
        ErrorMessages: null,
      },
      StatusCode: '200',
      Message: 'Success',
      ErrorMessages: null,
      RowVersion: null,
    };
  },

  /**
   * Get List Sales Person by Vendor Code
   */
  getSalesPersonsByVendorCode(params: { Code: string }): ApiResponse<KeyValuePair> {
    return {
      ReturnObject: MOCK_SALES_PERSONS,
      HeaderObj: {
        ResponseTime: '3 ms',
        StatusCode: '200',
        Message: 'Success',
        ErrorMessages: null,
      },
      StatusCode: '200',
      Message: 'Success',
      ErrorMessages: null,
      RowVersion: null,
    };
  },

  /**
   * Get All Asset Master Lv2 with Starting Price
   */
  getAssetMasters(params: {
    AssetHierarchyLv1Code: string;
    CmoEmpNo?: string;
    DealerCode: string;
    GetLatestAsset?: boolean;
  }): ApiResponse<AssetMaster> {
    return {
      ListAssetMasterObj: MOCK_ASSET_MASTERS,
      HeaderObj: {
        ResponseTime: '6 ms',
        StatusCode: '200',
        Message: 'Success',
        ErrorMessages: null,
      },
      StatusCode: '200',
      Message: 'Success',
      ErrorMessages: null,
      RowVersion: null,
    };
  },

  /**
   * Get List Manufacturing Year by Model
   */
  getManufacturingYears(params: {
    ModelCode: string;
    DealerCode: string;
  }): ApiResponse<KeyValuePair> {
    return {
      ReturnObject: MOCK_MANUFACTURING_YEARS,
      HeaderObj: {
        ResponseTime: '3 ms',
        StatusCode: '200',
        Message: 'Success',
        ErrorMessages: null,
      },
      StatusCode: '200',
      Message: 'Success',
      ErrorMessages: null,
      RowVersion: null,
    };
  },

  /**
   * Get List Asset Variant by Model and Manufacturing Year
   */
  getAssetVariants(params: {
    ModelCode: string;
    DealerCode: string;
    ManufYear: number;
  }): ApiResponse<KeyValuePair> {
    const variants = MOCK_VARIANTS[params.ModelCode] || [];

    return {
      ReturnObject: variants,
      HeaderObj: {
        ResponseTime: '4 ms',
        StatusCode: '200',
        Message: 'Success',
        ErrorMessages: null,
      },
      StatusCode: '200',
      Message: 'Success',
      ErrorMessages: null,
      RowVersion: null,
    };
  },

  /**
   * Get List Exterior Color by FSC Code and Manufacturing Year
   */
  getExteriorColors(params: {
    FscCode: string;
    ManufYear: number;
  }): ApiResponse<KeyValuePair> {
    return {
      ReturnObject: MOCK_EXTERIOR_COLORS,
      HeaderObj: {
        ResponseTime: '3 ms',
        StatusCode: '200',
        Message: 'Success',
        ErrorMessages: null,
      },
      StatusCode: '200',
      Message: 'Success',
      ErrorMessages: null,
      RowVersion: null,
    };
  },

  /**
   * Get List Interior Color by FSC Code, Manufacturing Year, and Exterior Color
   */
  getInteriorColors(params: {
    FscCode: string;
    ManufYear: number;
    ExtColorCode: string;
  }): ApiResponse<KeyValuePair> {
    const colors = MOCK_INTERIOR_COLORS[params.ExtColorCode] || MOCK_INTERIOR_COLORS['NB9'];

    return {
      ReturnObject: colors,
      HeaderObj: {
        ResponseTime: '3 ms',
        StatusCode: '200',
        Message: 'Success',
        ErrorMessages: null,
      },
      StatusCode: '200',
      Message: 'Success',
      ErrorMessages: null,
      RowVersion: null,
    };
  },

  /**
   * Get List Default Product Name from Rule by LeadNo
   */
  getDefaultProducts(params: { LeadNo: string }): ApiResponse<DefaultProduct> {
    return {
      ReturnObject: STANDARD_PRODUCTS.map((p) => ({
        ProductName: p.ProductName,
        MrInstSchemeCode: p.InstallmentSchemeCode,
        InstSchemeName: 'Regular Fixed',
      })),
      HeaderObj: {
        ResponseTime: '5 ms',
        StatusCode: '200',
        Message: 'Success',
        ErrorMessages: null,
      },
      StatusCode: '200',
      Message: 'Success',
      ErrorMessages: null,
      RowVersion: null,
    };
  },

  /**
   * Get List Default Products (for Step 5 cards). Aligns with GetListDefaultProductFromRuleByLeadNo.
   */
  getListDefaultProducts(params: { LeadNo?: string; otrPrice?: number }): {
    ListDefaultStandardProductObj: ProductCalculation[];
    ListDefaultPromotionProductObj: ProductCalculation[];
  } {
    const otrPrice = params.otrPrice ?? 500000000;
    const standard = getListDefaultProductsForCards(otrPrice);
    return {
      ListDefaultStandardProductObj: standard,
      ListDefaultPromotionProductObj: [],
    };
  },

  /**
   * CalculateProductFromRule / SimulateFinancialCalculate style.
   * Params: otrPrice, dpPrcnt, productCode, productName, firstInstallment (ADDM|ADDB).
   * Returns ListProductObj per tenor (12,24,36,48,60; 5050 only 12).
   */
  calculateProductFromRule(params: {
    otrPrice: number;
    dpPrcnt: number;
    productCode: string;
    productName: string;
    firstInstallment: 'ADDM' | 'ADDB';
  }): { ListProductObj: ProductCalculation[] } {
    const rows = computeProductRows(params);
    return { ListProductObj: rows };
  },

  /**
   * Get List Product from Rule by LeadNo (With Calculation) – backward compatible
   */
  getProductCalculations(params: { LeadNo?: string; otrPrice?: number }): {
    ListProductObj: ProductCalculation[];
  } {
    const otrPrice = params.otrPrice ?? 500000000;
    const products = getListDefaultProductsForCards(otrPrice);
    return { ListProductObj: products };
  },
};

/**
 * Check if mock mode is enabled.
 * USE_MOCK_API explicitly 'true' → mock; 'false' → real API.
 * When not set, default to mock in development only.
 */
export function isMockModeEnabled(): boolean {
  if (process.env.USE_MOCK_API === 'true') return true;
  if (process.env.USE_MOCK_API === 'false') return false;
  return process.env.NODE_ENV === 'development';
}

/**
 * Simulate API delay
 */
export async function simulateDelay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
