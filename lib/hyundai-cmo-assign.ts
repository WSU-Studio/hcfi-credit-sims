/** Client-safe CMO assignment helpers (no server-only imports). */

export type HyundaiKeyValue = { Key: string; Value: string };

/** CMO option for admin dropdown — includes office code for submit branching. */
export type CmoSelectOption = HyundaiKeyValue & {
  officeMemberCode: string;
};

export type OfficeMemberCmo = {
  OfficeMemberName: string;
  OfficeMemberCode: string;
  CMOName: string;
  CMOCode: string;
  IsActive: boolean;
};

function buildCmoSelectOptions(
  rows: OfficeMemberCmo[],
  oriOfficeCode?: string
): CmoSelectOption[] {
  const filtered = oriOfficeCode
    ? rows.filter((row) => row.OfficeMemberCode === oriOfficeCode)
    : rows;

  const seen = new Set<string>();
  const options: CmoSelectOption[] = [];

  for (const row of filtered) {
    if (row.IsActive === false) continue;
    const dedupeKey = `${row.CMOCode}:${row.OfficeMemberCode}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const officeLabel = row.OfficeMemberCode
      ? `${row.OfficeMemberName} (${row.OfficeMemberCode})`
      : row.OfficeMemberName;
    options.push({
      Key: `${row.CMOCode}:${row.OfficeMemberCode}`,
      Value: `${row.CMOName} — ${officeLabel}`,
      officeMemberCode: row.OfficeMemberCode,
    });
  }

  return options.sort((a, b) => a.Value.localeCompare(b.Value));
}

export function mapOfficeMemberCmoToKeyValue(
  rows: OfficeMemberCmo[],
  oriOfficeCode?: string
): HyundaiKeyValue[] {
  return buildCmoSelectOptions(rows, oriOfficeCode);
}

export function mapOfficeMemberCmoToSelectOptions(
  rows: OfficeMemberCmo[],
  oriOfficeCode?: string
): CmoSelectOption[] {
  return buildCmoSelectOptions(rows, oriOfficeCode);
}

/** 2 digit prefix office pada LeadNo Hyundai, mis. "11" dari "11STGLD20260700009". */
export function extractLeadNoOfficePrefix(leadNo: string): string | null {
  const match = leadNo.trim().match(/^(\d{2})/);
  return match?.[1] ?? null;
}

/** Cek apakah office CMO cocok dengan 2 digit awal LeadNo simulasi. */
export function isCmoOfficeMatchLeadNo(leadNo: string, cmoOfficeCode: string): boolean {
  const prefix = extractLeadNoOfficePrefix(leadNo);
  const office = cmoOfficeCode.trim();
  if (!prefix || !office) return false;
  return prefix === office;
}

/** Parse composite Key dari dropdown CMO (`CMOCode:OfficeMemberCode`). */
export function parseCmoSelectKey(key: string): {
  cmoCode: string;
  officeMemberCode: string;
} {
  const sep = key.indexOf(':');
  if (sep < 0) return { cmoCode: key, officeMemberCode: '' };
  return {
    cmoCode: key.slice(0, sep),
    officeMemberCode: key.slice(sep + 1),
  };
}

/** Parse CMOCode + CMOName untuk AddLeadCust (label UI bisa berisi suffix cabang). */
export function resolveCmoAssignFields(
  cmoCode: string,
  displayLabel: string
): { CMOCode: string; CMOName: string } {
  const { cmoCode: parsedCode } = parseCmoSelectKey(cmoCode);
  const sep = ' — ';
  const idx = displayLabel.lastIndexOf(sep);
  const cmoName = idx >= 0 ? displayLabel.slice(0, idx).trim() : displayLabel.trim();
  return { CMOCode: parsedCode, CMOName: cmoName || parsedCode };
}
