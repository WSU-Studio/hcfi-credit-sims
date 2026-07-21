/**
 * Lead monitoring — GetMonitoringByStgLeadNo (Postman v1.9).
 * Lebih lengkap dari GetPagingStageWebsiteLead: historis website → Confins.
 */

export type LeadTaskHistoryItem = {
  Name: string;
  IndicatorSLA: string | null;
  StartTime: string | null;
  EndTime: string | null;
  Assignee: string | null;
  Due: string | null;
  TrxNo: string | null;
};

export type LeadMonitoringResult = {
  LeadNo: string;
  CustConsentStatus: string;
  ListTaskHistory: LeadTaskHistoryItem[];
  /** Enrich dari DB lokal (endpoint monitoring tidak kirim nama/aset). */
  CustName?: string | null;
  VehicleSummary?: string | null;
};

/** @deprecated Prefer LeadMonitoringResult — disimpan untuk referensi response lama. */
export type WebsiteLeadStage = {
  LeadNo: string;
  ApprovalCode: string | null;
  CustName: string;
  AssetName: string;
  IdNo: string;
  LeadStepCode: string;
  LeadStepDescr: string;
  LeadStatCode: string;
  LeadStatDescr: string;
  CreatedDt: string;
  LastUpdDt: string;
  IsFromForward: boolean;
  IsTakenFromDealer: boolean;
  ChannelCode: string;
  UserInputName: string | null;
};

export function normalizeTaskHistory(raw: unknown): LeadTaskHistoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .map((row) => ({
      Name: String(row.Name ?? '').trim(),
      IndicatorSLA:
        row.IndicatorSLA == null || row.IndicatorSLA === ''
          ? null
          : String(row.IndicatorSLA),
      StartTime:
        row.StartTime == null || row.StartTime === '' ? null : String(row.StartTime),
      EndTime: row.EndTime == null || row.EndTime === '' ? null : String(row.EndTime),
      Assignee:
        row.Assignee == null || row.Assignee === '' ? null : String(row.Assignee),
      Due: row.Due == null || row.Due === '' ? null : String(row.Due),
      TrxNo: row.TrxNo == null || row.TrxNo === '' ? null : String(row.TrxNo),
    }))
    .filter((row) => row.Name.length > 0);
}

/** Chronological: oldest first (timeline top → bottom). */
export function sortTaskHistory(
  items: LeadTaskHistoryItem[]
): LeadTaskHistoryItem[] {
  return [...items].sort((a, b) => {
    const ta = a.StartTime ? Date.parse(a.StartTime) : Number.NaN;
    const tb = b.StartTime ? Date.parse(b.StartTime) : Number.NaN;
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return ta - tb;
  });
}

export function consentStatusTone(status: string): string {
  const code = status.trim().toUpperCase();
  if (!code) return 'bg-slate-50 text-slate-800 border-slate-200';
  if (code === 'SCS' || code.includes('SUCCESS') || code.includes('APPROV')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  if (code.includes('REJ') || code.includes('FAIL') || code.includes('CANCEL')) {
    return 'bg-red-50 text-red-800 border-red-200';
  }
  if (code.includes('PEND') || code.includes('WAIT') || code.includes('PROG')) {
    return 'bg-amber-50 text-amber-900 border-amber-200';
  }
  return 'bg-slate-50 text-slate-800 border-slate-200';
}
