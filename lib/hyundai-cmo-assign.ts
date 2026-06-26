/** Client-safe CMO assignment helpers (no server-only imports). */

export type HyundaiKeyValue = { Key: string; Value: string };

export type OfficeMemberCmo = {
  OfficeMemberName: string;
  OfficeMemberCode: string;
  CMOName: string;
  CMOCode: string;
  IsActive: boolean;
};

export function mapOfficeMemberCmoToKeyValue(
  rows: OfficeMemberCmo[],
  oriOfficeCode?: string
): HyundaiKeyValue[] {
  const filtered = oriOfficeCode
    ? rows.filter((row) => row.OfficeMemberCode === oriOfficeCode)
    : rows;

  const seen = new Set<string>();
  const options: HyundaiKeyValue[] = [];

  for (const row of filtered) {
    if (row.IsActive === false) continue;
    const dedupeKey = `${row.CMOCode}:${row.OfficeMemberCode}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    options.push({
      Key: row.CMOCode,
      Value: `${row.CMOName} — ${row.OfficeMemberName}`,
    });
  }

  return options.sort((a, b) => a.Value.localeCompare(b.Value));
}

/** Parse CMOCode + CMOName untuk AddLeadCust (label UI bisa berisi suffix cabang). */
export function resolveCmoAssignFields(
  cmoCode: string,
  displayLabel: string
): { CMOCode: string; CMOName: string } {
  const sep = ' — ';
  const idx = displayLabel.lastIndexOf(sep);
  const cmoName = idx >= 0 ? displayLabel.slice(0, idx).trim() : displayLabel.trim();
  return { CMOCode: cmoCode, CMOName: cmoName || cmoCode };
}
