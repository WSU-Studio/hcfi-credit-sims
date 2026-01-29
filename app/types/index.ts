export type NavItem = {
  label: string;
  href: string;
};

export type Benefit = {
  title: string;
  description: string;
};

export type Product = {
  title: string;
  subtitle?: string;
  image: string;
};

export type Article = {
  title: string;
  image: string;
  slug?: string;
};

export type Slide = {
  title: string;
  highlight: string;
  description: string;
  image: string;
};

export type ContactItem = {
  label: string;
  text: string;
  href?: string;
  icon?: React.ReactNode;
};

export type AppLink = {
  label: string;
  src: string;
  href: string;
};

export type CompanyInfo = {
  name: string;
  address: string[];
  legalLinks: { label: string; href: string }[];
  contact: ContactItem[];
  apps: AppLink[];
  disclaimer?: string;
  copyright?: string;
};

// Re-export credit simulation types
export type {
  ApiResponse,
  KeyValuePair,
  Vendor,
  VendorKeyValue,
  AssetMaster,
  ManufacturingYear,
  AssetVariant,
  ExteriorColor,
  InteriorColor,
  ProductCalculation,
  DefaultProduct,
  SimulationFormData,
  SimulationResult,
} from './credit-simulation';
