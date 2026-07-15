import sharp from 'sharp';
import { validateImageFile } from '@/lib/image-utils';

/**
 * Normalisasi gambar sebelum dikirim ke endpoint OCR Hyundai / IdFile AddLeadCust.
 *
 * Hyundai (Adins) OCR engine hanya bisa decode JPEG/PNG. AddLeadCust lebih ketat
 * lagi — menolak WebP / file corrupt dengan "not a valid Base64 string" walau
 * string base64-nya syntactically valid.
 */
const OCR_SAFE_MIME = 'image/jpeg';
const OCR_SAFE_EXT = 'jpeg';
const OCR_JPEG_QUALITY = 85;
/** Batas aman ukuran binary sebelum base64 (~2MB file → ~2.7MB base64 di JSON). */
const MAX_HYUNDAI_IMAGE_BYTES = 2 * 1024 * 1024;
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

function replaceExtension(fileName: string, newExt: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0) return `${fileName}.${newExt}`;
  return `${fileName.slice(0, dot)}.${newExt}`;
}

export type OcrPreparedImage = {
  buffer: Buffer;
  contentType: string;
  fileName: string;
  base64: string;
  /** True kalau buffer di-re-encode (bukan original mentah). */
  reEncoded: boolean;
  sourceContentType: string;
  sourceFileName: string;
};

export async function prepareImageForOcr(input: {
  buffer: Buffer;
  sourceContentType: string;
  sourceFileName: string;
}): Promise<OcrPreparedImage> {
  const validation = validateImageFile(input.buffer);
  if (!validation.ok) {
    throw new Error(validation.error || 'Format KTP tidak didukung');
  }

  let buffer: Buffer;
  try {
    buffer = await sharp(input.buffer)
      .rotate() // honor EXIF orientation
      .resize({
        width: 2048,
        height: 2048,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: OCR_JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
  } catch (convertErr) {
    console.error('[ocr-image-prepare] convert failed:', convertErr);
    throw new Error(
      'KTP tidak bisa diproses. Pastikan file berupa foto jelas (JPG/PNG/WEBP).'
    );
  }

  if (buffer.length > MAX_HYUNDAI_IMAGE_BYTES) {
    buffer = await sharp(buffer)
      .jpeg({ quality: 70, mozjpeg: true })
      .toBuffer();
  }

  if (!buffer.subarray(0, 3).equals(JPEG_MAGIC)) {
    throw new Error('KTP gagal dikonversi ke JPEG yang valid');
  }

  const fileName = replaceExtension(input.sourceFileName, OCR_SAFE_EXT);

  return {
    buffer,
    contentType: OCR_SAFE_MIME,
    fileName,
    base64: buffer.toString('base64'),
    reEncoded: true,
    sourceContentType: input.sourceContentType,
    sourceFileName: input.sourceFileName,
  };
}
