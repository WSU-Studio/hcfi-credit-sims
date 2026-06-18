/**
 * Normalisasi konten file (base64) & nama file untuk payload Hyundai
 * (`IdFile.Content`, `byteBase64`). AddLeadCust lebih ketat daripada OCR —
 * mis. menolak WebP walau string base64-nya syntactically valid.
 */

const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

/** Bersihkan & validasi string base64 sebelum dikirim ke Hyundai. */
export function sanitizeBase64ForHyundai(raw: string, label = 'File'): string {
  let s = raw.trim();
  const dataUrl = s.match(/^data:[^;]+;base64,(.+)$/i);
  if (dataUrl) s = dataUrl[1];
  s = s.replace(/\s/g, '');

  if (!s) {
    throw new Error(`${label}: konten kosong`);
  }
  if (!BASE64_RE.test(s) || s.length % 4 !== 0) {
    throw new Error(`${label}: konten bukan Base64 yang valid`);
  }

  const decoded = Buffer.from(s, 'base64');
  if (decoded.length === 0) {
    throw new Error(`${label}: konten Base64 kosong setelah decode`);
  }

  return s;
}

/** Nama file aman untuk Hyundai (hindari spasi/karakter aneh di IdFile.FileName). */
export function normalizeHyundaiFileName(fileName: string, preferredExt = 'jpg'): string {
  const dot = fileName.lastIndexOf('.');
  const ext = dot > 0 ? fileName.slice(dot + 1) : preferredExt;
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || preferredExt;
  return `ktp-${Date.now()}.${safeExt}`;
}
