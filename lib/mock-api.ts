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
  { Key: 2024, Value: 2024 },
  { Key: 2025, Value: 2025 },
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

/**
 * Credit Calculation Logic
 * Menghitung simulasi kredit berdasarkan harga OTR
 */
function calculateCreditProducts(otrPrice: number): ProductCalculation[] {
  const products: ProductCalculation[] = [];

  // Product 1: Low DP (10% DP, 36 bulan)
  const dp1 = otrPrice * 0.1;
  const loanAmount1 = otrPrice - dp1;
  const interestRate1 = 0.12; // 12% per tahun
  const tenor1 = 36;
  const monthlyInterest1 = interestRate1 / 12;
  const installment1 =
    (loanAmount1 * monthlyInterest1 * Math.pow(1 + monthlyInterest1, tenor1)) /
    (Math.pow(1 + monthlyInterest1, tenor1) - 1);

  products.push({
    ProductCode: 'RF',
    ProductName: 'Loan Low DP',
    TdpAmt: Math.round(dp1),
    InstallmentAmt: Math.round(installment1),
    InstallmentSchemeCode: 'RF',
    Default: true,
    DPPrcnt: 10,
    DPPrcntBhv: 'Min',
    Tenor: tenor1,
    FirstInstallment: 'ADDB',
    EffRatePrcnt: 12,
    EffRateBhv: 'LOCK',
    BalloonAmt: 0,
    DefermentPeriod: 0,
    DefermentRatePrcnt: 0,
    AdminFeeAmt: 2000000,
    AdminFeeCptlz: false,
    AdminFeeBhv: 'FIXED',
    ProvisionType: 'PRCNT',
    ProvisionFee: 2,
    ProvisionFeeCptlz: false,
    ProvisionFeeBhv: 'FIXED',
    FiduciaFeeAmt: 1000000,
    FiduciaFeeCptlz: false,
    FiduciaFeeBhv: 'FIXED',
  });

  // Product 2: Medium DP (20% DP, 48 bulan)
  const dp2 = otrPrice * 0.2;
  const loanAmount2 = otrPrice - dp2;
  const interestRate2 = 0.11; // 11% per tahun
  const tenor2 = 48;
  const monthlyInterest2 = interestRate2 / 12;
  const installment2 =
    (loanAmount2 * monthlyInterest2 * Math.pow(1 + monthlyInterest2, tenor2)) /
    (Math.pow(1 + monthlyInterest2, tenor2) - 1);

  products.push({
    ProductCode: 'RF48',
    ProductName: 'Loan Medium DP',
    TdpAmt: Math.round(dp2),
    InstallmentAmt: Math.round(installment2),
    InstallmentSchemeCode: 'RF',
    Default: false,
    DPPrcnt: 20,
    DPPrcntBhv: 'Min',
    Tenor: tenor2,
    FirstInstallment: 'ADDB',
    EffRatePrcnt: 11,
    EffRateBhv: 'LOCK',
    BalloonAmt: 0,
    DefermentPeriod: 0,
    DefermentRatePrcnt: 0,
    AdminFeeAmt: 2000000,
    AdminFeeCptlz: false,
    AdminFeeBhv: 'FIXED',
    ProvisionType: 'PRCNT',
    ProvisionFee: 2,
    ProvisionFeeCptlz: false,
    ProvisionFeeBhv: 'FIXED',
    FiduciaFeeAmt: 1000000,
    FiduciaFeeCptlz: false,
    FiduciaFeeBhv: 'FIXED',
  });

  // Product 3: High DP (30% DP, 60 bulan)
  const dp3 = otrPrice * 0.3;
  const loanAmount3 = otrPrice - dp3;
  const interestRate3 = 0.10; // 10% per tahun
  const tenor3 = 60;
  const monthlyInterest3 = interestRate3 / 12;
  const installment3 =
    (loanAmount3 * monthlyInterest3 * Math.pow(1 + monthlyInterest3, tenor3)) /
    (Math.pow(1 + monthlyInterest3, tenor3) - 1);

  products.push({
    ProductCode: 'RF60',
    ProductName: 'Loan High DP',
    TdpAmt: Math.round(dp3),
    InstallmentAmt: Math.round(installment3),
    InstallmentSchemeCode: 'RF',
    Default: false,
    DPPrcnt: 30,
    DPPrcntBhv: 'Min',
    Tenor: tenor3,
    FirstInstallment: 'ADDB',
    EffRatePrcnt: 10,
    EffRateBhv: 'LOCK',
    BalloonAmt: 0,
    DefermentPeriod: 0,
    DefermentRatePrcnt: 0,
    AdminFeeAmt: 2000000,
    AdminFeeCptlz: false,
    AdminFeeBhv: 'FIXED',
    ProvisionType: 'PRCNT',
    ProvisionFee: 2,
    ProvisionFeeCptlz: false,
    ProvisionFeeBhv: 'FIXED',
    FiduciaFeeAmt: 1000000,
    FiduciaFeeCptlz: false,
    FiduciaFeeBhv: 'FIXED',
  });

  // Product 4: Special Promo (15% DP, 36 bulan, lower rate)
  const dp4 = otrPrice * 0.15;
  const loanAmount4 = otrPrice - dp4;
  const interestRate4 = 0.095; // 9.5% per tahun (promo)
  const tenor4 = 36;
  const monthlyInterest4 = interestRate4 / 12;
  const installment4 =
    (loanAmount4 * monthlyInterest4 * Math.pow(1 + monthlyInterest4, tenor4)) /
    (Math.pow(1 + monthlyInterest4, tenor4) - 1);

  products.push({
    ProductCode: 'PROMO',
    ProductName: 'Lo Cicilan Paling Murah',
    TdpAmt: Math.round(dp4),
    InstallmentAmt: Math.round(installment4),
    InstallmentSchemeCode: 'RF',
    Default: false,
    DPPrcnt: 15,
    DPPrcntBhv: 'Min',
    Tenor: tenor4,
    FirstInstallment: 'ADDB',
    EffRatePrcnt: 9.5,
    EffRateBhv: 'LOCK',
    BalloonAmt: 0,
    DefermentPeriod: 0,
    DefermentRatePrcnt: 0,
    AdminFeeAmt: 1500000, // Promo: admin fee lebih murah
    AdminFeeCptlz: false,
    AdminFeeBhv: 'FIXED',
    ProvisionType: 'PRCNT',
    ProvisionFee: 1.5, // Promo: provision lebih murah
    ProvisionFeeCptlz: false,
    ProvisionFeeBhv: 'FIXED',
    FiduciaFeeAmt: 1000000,
    FiduciaFeeCptlz: false,
    FiduciaFeeBhv: 'FIXED',
  });

  return products;
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
      ReturnObject: [
        {
          ProductName: 'Lo Cicilan Paling Murah',
          MrInstSchemeCode: 'RF',
          InstSchemeName: 'Regular Fixed',
        },
        {
          ProductName: 'Loan Low DP',
          MrInstSchemeCode: 'RF',
          InstSchemeName: 'Regular Fixed',
        },
        {
          ProductName: 'Loan Medium DP',
          MrInstSchemeCode: 'RF',
          InstSchemeName: 'Regular Fixed',
        },
        {
          ProductName: 'Loan High DP',
          MrInstSchemeCode: 'RF',
          InstSchemeName: 'Regular Fixed',
        },
      ],
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
   * Get List Product from Rule by LeadNo (With Calculation)
   * This is the main calculation API
   */
  getProductCalculations(params: { LeadNo: string; otrPrice?: number }): {
    ListProductObj: ProductCalculation[];
  } {
    // In real API, LeadNo contains the OTR price info
    // For mock, we use otrPrice parameter or default to 500M
    const otrPrice = params.otrPrice || 500000000;
    const products = calculateCreditProducts(otrPrice);

    return {
      ListProductObj: products,
    };
  },
};

/**
 * Check if mock mode is enabled
 */
export function isMockModeEnabled(): boolean {
  return process.env.USE_MOCK_API === 'true' || process.env.NODE_ENV === 'development';
}

/**
 * Simulate API delay
 */
export async function simulateDelay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
