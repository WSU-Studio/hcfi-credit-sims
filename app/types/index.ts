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

