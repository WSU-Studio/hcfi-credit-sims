import sharp from 'sharp';

/**
 * Normalisasi gambar sebelum dikirim ke endpoint OCR Hyundai.
 *
 * Hyundai (Adins) OCR engine hanya bisa decode JPEG/PNG. Kalau dikirim WebP /
 * GIF, request balik HTTP 200 tapi field `Read` null → kita anggap FAILED.
 * Helper ini wrap proses re-encode supaya satu sumber kebenaran dipakai baik
 * oleh flow leads (S3) maupun tool test OCR (file upload langsung).
 */
const OCR_SAFE_MIME = 'image/jpeg';
const OCR_SAFE_EXT = 'jpg';
const OCR_JPEG_QUALITY = 90;

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
  let buffer = input.buffer;
  let reEncoded = false;

  // Selalu re-encode ke JPEG — jangan andalkan Content-Type S3 saja.
  // Kasus umum: object WebP di S3 tapi header `image/jpeg`, atau file corrupt
  // yang bikin AddLeadCust menolak dengan "not a valid Base64 string".
  try {
    buffer = await sharp(input.buffer)
      .rotate() // honor EXIF orientation
      .jpeg({ quality: OCR_JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
    reEncoded = true;
  } catch (convertErr) {
    console.warn(
      '[ocr-image-prepare] gagal konversi ke JPEG, fallback kirim original:',
      convertErr instanceof Error ? convertErr.message : convertErr
    );
  }

  const contentType = reEncoded ? OCR_SAFE_MIME : input.sourceContentType;
  const fileName = reEncoded
    ? replaceExtension(input.sourceFileName, OCR_SAFE_EXT)
    : input.sourceFileName;

  return {
    buffer,
    contentType,
    fileName,
    base64: buffer.toString('base64'),
    reEncoded,
    sourceContentType: input.sourceContentType,
    sourceFileName: input.sourceFileName,
  };
}
