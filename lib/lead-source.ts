export const LEAD_SOURCES = {
  WEBSITE: 'WEBSITE',
  DEALER_SALES: 'DEALER_SALES',
} as const;

export type LeadSource = (typeof LEAD_SOURCES)[keyof typeof LEAD_SOURCES];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  [LEAD_SOURCES.WEBSITE]: 'Website',
  [LEAD_SOURCES.DEALER_SALES]: 'Dealer Sales',
};
