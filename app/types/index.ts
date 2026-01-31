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
  ctaLabel?: string;
  ctaUrl?: string;
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

// Static page layout (widget-based)
export type LayoutCell = {
  id: string;
  widgetType: 'text' | 'text_image';
  payload: Record<string, unknown>;
};

export type LayoutRow = {
  id: string;
  gridCols: 1 | 2 | 3;
  cells: LayoutCell[];
  /** Jika true (default), row dibungkus Container; jika false, row full width sampai tepi layar */
  useContainer?: boolean;
  /** Margin top 16px (mt-4) bila true */
  marginTop?: boolean;
  /** Margin bottom 16px (mb-4) bila true */
  marginBottom?: boolean;
};

export type PageLayout = {
  rows: LayoutRow[];
};

export type TextWidgetPayload = {
  content: string;
};

export type TextImageWidgetPayload = {
  title?: string;
  body?: string;
  imageUrl?: string;
  imagePosition?: 'left' | 'right' | 'above' | 'below';
  imageRatio?: 'default' | '1:1' | '4:3' | '16:9' | '3:1' | '4:1' | '5:1';
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
