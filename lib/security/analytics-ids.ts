/** GTM / GA4 ID format checks (safe for client + server). */

export function isSafeGtmId(value: string): boolean {
  return /^GTM-[A-Z0-9]+$/i.test(value.trim());
}

export function isSafeGaMeasurementId(value: string): boolean {
  return /^G-[A-Z0-9]+$/i.test(value.trim());
}
