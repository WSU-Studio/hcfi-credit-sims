/**
 * Helpers untuk mendeteksi & merangkum error well-known dari sisi Hyundai LOS.
 *
 * Pattern utama: LINQ/EF Core exception yang muncul saat backend mereka
 * gagal evaluate query parameter expression. Ini sudah lama jadi issue
 * recurring di sisi Hyundai. Sekarang kita TIDAK fallback ke mock—pesan
 * error tetap dilempar ke user, hanya disederhanakan jadi user-friendly.
 *
 * Pesan ke UI publik tidak boleh menyebut vendor (Adins/Hyundai) atau
 * detail teknis API (HTTP/StatusCode/stack).
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

/**
 * Pesan khas dari gateway/load balancer di depan service Hyundai (Envoy/Istio/nginx).
 * Indikasi service backend sedang down / maintenance / unhealthy.
 */
const UPSTREAM_DOWN_FRAGMENTS = [
  'no healthy upstream',
  'upstream connect error',
  'upstream request timeout',
  'service unavailable',
  'bad gateway',
  'gateway timeout',
];

/** Fragmen yang menandai pesan terlalu teknis / vendor-leaking untuk end-user. */
const TECHNICAL_LEAK_FRAGMENTS = [
  'adins',
  'adinskey',
  'hyundai',
  'statuscode',
  'headerobj',
  'error id',
  'http 200',
  'http 4',
  'http 5',
  'simulatefinancial',
  'finalcalculate',
  'calculateproduct',
  'addleadas',
  'getocr',
  'linq',
  'exception',
  'stack trace',
  'field "read"',
  'field \'read\'',
  'bukan bug',
  'engine ocr',
];

const ERROR_ID_REGEX = /Error ID\s*:\s*([0-9a-f-]{8,})/i;

export const DEFAULT_USER_FACING_SERVICE_ERROR =
  'Layanan simulasi kredit sedang tidak tersedia. Silakan coba beberapa saat lagi.';

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

/** True jika gateway Hyundai melaporkan upstream/backend mereka down (HTTP 502/503/504 dari Envoy/Istio). */
export function isHyundaiUpstreamDown(error: unknown): boolean {
  const msg = rawMessage(error).toLowerCase();
  if (!msg) return false;
  return UPSTREAM_DOWN_FRAGMENTS.some((fragment) => msg.includes(fragment));
}

/** Ambil Error ID dari pesan Hyundai (kalau ada) untuk eskalasi — log server saja. */
export function extractHyundaiErrorId(error: unknown): string | null {
  const msg = rawMessage(error);
  const match = msg.match(ERROR_ID_REGEX);
  return match?.[1] ?? null;
}

function looksTechnicalForUser(msg: string): boolean {
  const lower = msg.toLowerCase();
  return TECHNICAL_LEAK_FRAGMENTS.some((fragment) => lower.includes(fragment));
}

/**
 * Hapus penyebutan vendor dari pesan yang masih aman ditampilkan.
 * Tidak menggantikan filtering teknis — itu dilakukan di toUserFacingHyundaiError.
 */
export function stripVendorNamesFromUserMessage(msg: string): string {
  return msg
    .replace(/\bAdins\b/gi, '')
    .replace(/\bAdIns\b/gi, '')
    .replace(/\bHyundai\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim();
}

/**
 * Translate pesan teknis upstream jadi pesan ramah untuk user publik.
 * Detail teknis tetap dilog di server untuk debugging.
 */
export function toUserFacingHyundaiError(
  error: unknown,
  fallback: string = DEFAULT_USER_FACING_SERVICE_ERROR
): string {
  const safeFallback = looksTechnicalForUser(fallback)
    ? DEFAULT_USER_FACING_SERVICE_ERROR
    : stripVendorNamesFromUserMessage(fallback) || DEFAULT_USER_FACING_SERVICE_ERROR;

  if (isHyundaiUpstreamDown(error)) {
    return 'Layanan simulasi kredit sedang tidak tersedia. Silakan coba beberapa saat lagi atau hubungi customer service kami.';
  }
  if (isHyundaiLinqException(error) || isHyundaiTransientException(error)) {
    return 'Layanan simulasi kredit sedang sibuk. Silakan coba beberapa saat lagi atau hubungi customer service kami.';
  }
  const msg = rawMessage(error);
  if (!msg) return safeFallback;

  const withoutErrorId = msg.replace(ERROR_ID_REGEX, '').trim();
  if (!withoutErrorId || looksTechnicalForUser(withoutErrorId)) {
    return safeFallback;
  }

  return stripVendorNamesFromUserMessage(withoutErrorId) || safeFallback;
}

function rawMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error ?? '');
}
