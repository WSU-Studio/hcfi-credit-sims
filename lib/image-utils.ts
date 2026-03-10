/**
 * Magic bytes (file signatures) for allowed image formats.
 * Validates file content, not just extension.
 */
const IMAGE_SIGNATURES: [Buffer, string][] = [
  [Buffer.from([0xff, 0xd8, 0xff]), 'image/jpeg'],
  [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/png'],
  [Buffer.from([0x47, 0x49, 0x46, 0x38]), 'image/gif'], // GIF87a or GIF89a
  [Buffer.from([0x52, 0x49, 0x46, 0x46]), 'image/webp'], // RIFF....WEBP
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function isAllowedImage(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  for (const [sig, mime] of IMAGE_SIGNATURES) {
    if (buffer.subarray(0, sig.length).equals(sig)) {
      if (mime === 'image/webp' && buffer.length >= 12) {
        return buffer.toString('ascii', 8, 12) === 'WEBP';
      }
      return true;
    }
  }
  return false;
}

export function validateImageFile(buffer: Buffer): { ok: boolean; error?: string } {
  if (buffer.length > MAX_FILE_SIZE) {
    return { ok: false, error: 'Ukuran file maksimal 10MB' };
  }
  if (!isAllowedImage(buffer)) {
    return { ok: false, error: 'Format gambar tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP' };
  }
  return { ok: true };
}
