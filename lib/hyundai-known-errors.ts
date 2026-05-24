/**
 * Helpers untuk mendeteksi & merangkum error well-known dari sisi Hyundai LOS.
 *
 * Pattern utama: LINQ/EF Core exception yang muncul saat backend mereka
 * gagal evaluate query parameter expression. Ini sudah lama jadi issue
 * recurring di sisi Hyundai. Sekarang kita TIDAK fallback ke mock—pesan
 * error tetap dilempar ke user, hanya disederhanakan jadi user-friendly.
 */

const LINQ_EXCEPTION_FRAGMENTS = [
  'linq query parameter',
  'linq query parameter expression',
  'dbcontextoptionsbuilder',
  'enablesensitivedatalogging',
  'an exception was thrown while attempting to evaluate',
];

const TRANSIENT_FRAGMENTS = [
  'exception has been occured',
  'an error occurred while processing your request',
];

const ERROR_ID_REGEX = /Error ID\s*:\s*([0-9a-f-]{8,})/i;

export function isHyundaiLinqException(error: unknown): boolean {
  const msg = rawMessage(error).toLowerCase();
  if (!msg) return false;
  return LINQ_EXCEPTION_FRAGMENTS.some((fragment) => msg.includes(fragment));
}

export function isHyundaiTransientException(error: unknown): boolean {
  if (isHyundaiLinqException(error)) return true;
  const msg = rawMessage(error).toLowerCase();
  return TRANSIENT_FRAGMENTS.some((fragment) => msg.includes(fragment));
}

/** Ambil Error ID dari pesan Hyundai (kalau ada) untuk eskalasi ke pihak Hyundai. */
export function extractHyundaiErrorId(error: unknown): string | null {
  const msg = rawMessage(error);
  const match = msg.match(ERROR_ID_REGEX);
  return match?.[1] ?? null;
}

/**
 * Translate pesan teknis Hyundai jadi pesan ramah untuk user.
 * Detail teknis (LINQ trace, Error ID) tetap dilog di server untuk debugging.
 */
export function toUserFacingHyundaiError(
  error: unknown,
  fallback: string = 'Layanan simulasi kredit Hyundai sedang tidak tersedia. Silakan coba beberapa saat lagi.'
): string {
  if (isHyundaiLinqException(error) || isHyundaiTransientException(error)) {
    return 'Layanan simulasi kredit Hyundai sedang sibuk. Silakan coba beberapa saat lagi atau hubungi customer service kami.';
  }
  const msg = rawMessage(error);
  if (!msg) return fallback;
  // Buang stack/error-id supaya tidak bocor ke user awam
  const sanitized = msg.replace(ERROR_ID_REGEX, '').trim();
  return sanitized || fallback;
}

function rawMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error ?? '');
}
