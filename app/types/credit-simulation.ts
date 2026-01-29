// Type definitions untuk Credit Simulation API

// Base API Response Structure
export interface ApiResponse<T> {
  ReturnObject?: T[];
  ListAssetMasterObj?: T[];
  ListProductObj?: T[];
  HeaderObj: {
    ResponseTime: string;
    StatusCode: string;
    Message: string;
    ErrorMessages: string[] | null;
  };
  StatusCode: string;
  Message: string;
  ErrorMessages: string[] | null;
  RowVersion: string | null;
}

// Key-Value pair (umum digunakan untuk dropdown)
export interface KeyValuePair {
  Key: string | number;
  Value: string;
}

// Vendor/Dealer Types
export interface Vendor {
  VendorCode: string;
  VendorName: string;
  ZipCode: string;
  City: string;
  OriOfficeCode: string;
  OriOfficeName: string;
}

export interface VendorKeyValue extends KeyValuePair {
  Key: string; // VendorCode
  Value: string; // VendorName
}

// Asset Master Types
export interface AssetMaster {
  AssetCategoryName: string; // SUV, EV, MPV
  AssetCode: string; // 4U, 4V, etc
  AssetName: string; // THE ALL NEW SANTA FE
  Price: number; // Starting price
  FullAssetCode: string; // HYUNDAI4U
  ManufacturingYear?: number;
}

// Manufacturing Year (Key/Value both number, unlike KeyValuePair)
export interface ManufacturingYear {
  Key: number;
  Value: number;
}

// Asset Variant/Trim
export interface AssetVariant extends KeyValuePair {
  Key: string; // FscCode (trim code)
  Value: string; // SANTA FE HEV PRIME
}

// Color Types
export interface ExteriorColor extends KeyValuePair {
  Key: string; // Color code
  Value: string; // Color name
}

export interface InteriorColor extends KeyValuePair {
  Key: string; // Color code
  Value: string; // Color name
}

// Product Types (Simulasi Kredit)
export interface ProductCalculation {
  ProductCode: string;
  ProductName: string;
  TdpAmt: number; // Down Payment Amount
  InstallmentAmt: number; // Angsuran per bulan
  InstallmentSchemeCode: string; // RF, etc
  Default: boolean;
  DPPrcnt: number; // DP Percentage
  DPPrcntBhv: string; // Min/Max behavior
  Tenor: number; // Tenor dalam bulan
  FirstInstallment: string; // First installment behavior
  EffRatePrcnt: number; // Effective rate percentage
  EffRateBhv: string;
  BalloonAmt: number;
  DefermentPeriod: number;
  DefermentRatePrcnt: number;
  AdminFeeAmt: number;
  AdminFeeCptlz: boolean;
  AdminFeeBhv: string;
  ProvisionType: string;
  ProvisionFee: number;
  ProvisionFeeCptlz: boolean;
  ProvisionFeeBhv: string;
  FiduciaFeeAmt: number;
  FiduciaFeeCptlz: boolean;
  FiduciaFeeBhv: string;
}

export interface DefaultProduct {
  ProductName: string;
  MrInstSchemeCode: string;
  InstSchemeName: string;
}

// Form State Types
export interface SimulationFormData {
  // Step 1: Dealer
  dealerCode?: string;
  dealerName?: string;
  city?: string;

  // Step 2: Model
  modelCode?: string;
  modelName?: string;
  fullAssetCode?: string;
  assetCategory?: string;
  manufacturingYear?: number;

  // Step 3: Specification
  fscCode?: string; // Trim code
  trimName?: string;
  exteriorColorCode?: string;
  exteriorColorName?: string;
  interiorColorCode?: string;
  interiorColorName?: string;

  // Step 4: Price & Calculation
  otrPrice?: number; // Harga OTR
  leadNo?: string; // Lead number dari API
}

export interface SimulationResult {
  products: ProductCalculation[];
  selectedProduct?: ProductCalculation;
  calculationDate: Date;
}
