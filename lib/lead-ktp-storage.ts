import { GetObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { getS3Bucket, getS3Client } from '@/lib/s3-client';
import { extractBucketAndKeyFromS3Url, isLeadKtpS3Key } from '@/lib/s3-url';

async function bodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body) throw new Error('Empty S3 body');
  if (body instanceof Uint8Array) return Buffer.from(body);
  const chunks: Buffer[] = [];
  const stream = body as AsyncIterable<Uint8Array>;
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * OCR engine Hyundai (Adins-side) hanya kenal format JPEG/PNG. File yang
 * ter-upload user lewat browser modern biasanya disimpan sebagai WebP — kalau
 * dikirim apa adanya, OCR jalan tapi response balik tanpa field `Read` (engine
 * tidak bisa decode WebP). Maka kita normalisasi semua format ke JPEG sebelum
 * encode ke base64.
 *
 * Kasus 2026-06-03 — LeadNo 13STGLD20260600008 (John Doe):
 *   ktpUrl = .../*.webp → OCR sukses HTTP 200 tapi `Read` null → IdNo masuk
 *   sebagai "0000000000000000" placeholder.
 */
const OCR_SAFE_MIME = 'image/jpeg';
const OCR_SAFE_EXT = 'jpg';
const OCR_JPEG_QUALITY = 90;

function replaceExtension(fileName: string, newExt: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0) return `${fileName}.${newExt}`;
  return `${fileName.slice(0, dot)}.${newExt}`;
}

export async function fetchLeadKtpFromS3(ktpUrl: string): Promise<{
  buffer: Buffer;
  contentType: string;
  fileName: string;
  base64: string;
}> {
  const bucket = getS3Bucket();

  const parsed = extractBucketAndKeyFromS3Url(ktpUrl.trim());
  if (!parsed || parsed.bucket !== bucket || !isLeadKtpS3Key(parsed.key)) {
    throw new Error('Invalid KTP URL');
  }

  const client = getS3Client();
  const out = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: parsed.key })
  );

  const rawBuffer = await bodyToBuffer(out.Body);
  const sourceContentType = out.ContentType ?? 'image/webp';
  const sourceFileName = parsed.key.split('/').pop() ?? 'ktp.webp';

  let buffer = rawBuffer;
  let contentType = sourceContentType;
  let fileName = sourceFileName;

  if (sourceContentType !== OCR_SAFE_MIME) {
    try {
      buffer = await sharp(rawBuffer)
        .rotate() // honor EXIF orientation
        .jpeg({ quality: OCR_JPEG_QUALITY, mozjpeg: true })
        .toBuffer();
      contentType = OCR_SAFE_MIME;
      fileName = replaceExtension(sourceFileName, OCR_SAFE_EXT);
    } catch (convertErr) {
      console.warn(
        '[lead-ktp-storage] gagal konversi ke JPEG, fallback kirim original:',
        convertErr instanceof Error ? convertErr.message : convertErr
      );
    }
  }

  const base64 = buffer.toString('base64');
  return { buffer, contentType, fileName, base64 };
}
