import {
  coerceOcrKtpSnapshot,
  isOcrKtpSnapshotComplete,
} from '@/lib/ocr-ktp-snapshot';

/** Lead dianggap lengkap untuk credit scoring bila KTP + OCR + ibu kandung + kepemilikan rumah terisi. */
export function isLeadScoringComplete(lead: {
  ktpUrl?: string | null;
  motherName?: string | null;
  homeOwnershipStatus?: string | null;
  ocrSnapshot?: unknown;
}): boolean {
  if (!lead.ktpUrl?.trim()) return false;
  if (!lead.motherName?.trim()) return false;
  if (!lead.homeOwnershipStatus?.trim()) return false;
  return isOcrKtpSnapshotComplete(coerceOcrKtpSnapshot(lead.ocrSnapshot));
}
