/**
 * Picks the value for the given locale from an object with optional *En fields.
 * Falls back to the default (id) field when locale is "en" but *En is null/undefined.
 */
export type Locale = "id" | "en";

export function pickLocaleField<T extends Record<string, unknown>>(
  obj: T,
  keyId: keyof T,
  keyEn: keyof T,
  locale: Locale
): string | null | undefined {
  if (locale === "en") {
    const enVal = obj[keyEn];
    if (enVal != null && String(enVal).trim() !== "") return enVal as string;
  }
  const idVal = obj[keyId];
  return idVal != null ? (idVal as string) : undefined;
}

export function pickLocaleString(
  idValue: string | null | undefined,
  enValue: string | null | undefined,
  locale: Locale
): string {
  if (locale === "en" && enValue != null && String(enValue).trim() !== "") {
    return enValue;
  }
  return idValue ?? "";
}
