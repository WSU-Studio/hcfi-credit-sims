import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getS3Bucket, getS3Client } from '@/lib/s3-client';
import { readLocalKtpFile } from '@/lib/local-ktp-storage';
import { parseKtpStorageUrl } from '@/lib/ktp-url';
import { prepareImageForOcr } from '@/lib/ocr-image-prepare';

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

async function readRawKtpObject(ktpUrl: string): Promise<{
  buffer: Buffer;
  contentType: string;
  fileName: string;
}> {
  const ref = parseKtpStorageUrl(ktpUrl);
  if (!ref) {
    throw new Error('Invalid KTP URL');
  }

  if (ref.kind === 'local') {
    const local = await readLocalKtpFile(ref.key);
    return {
      buffer: local.buffer,
      contentType: local.contentType,
      fileName: ref.key.split('/').pop() ?? 'ktp.webp',
    };
  }

  const bucket = getS3Bucket();
  if (ref.bucket !== bucket) {
    throw new Error('Invalid KTP URL');
  }

  const client = getS3Client();
  const out = await client.send(
    new GetObjectCommand({ Bucket: ref.bucket, Key: ref.key })
  );

  return {
    buffer: await bodyToBuffer(out.Body),
    contentType: out.ContentType ?? 'image/webp',
    fileName: ref.key.split('/').pop() ?? 'ktp.webp',
  };
}

/**
 * Tarik KTP (S3 atau local dev) lalu normalisasi format supaya OCR Hyundai bisa
 * decode (lihat lib/ocr-image-prepare.ts untuk konteks WebP→JPEG).
 */
export async function fetchLeadKtpFromS3(ktpUrl: string): Promise<{
  buffer: Buffer;
  contentType: string;
  fileName: string;
  base64: string;
}> {
  const raw = await readRawKtpObject(ktpUrl);

  const prepared = await prepareImageForOcr({
    buffer: raw.buffer,
    sourceContentType: raw.contentType,
    sourceFileName: raw.fileName,
  });

  return {
    buffer: prepared.buffer,
    contentType: prepared.contentType,
    fileName: prepared.fileName,
    base64: prepared.base64,
  };
}

/** Raw bytes untuk preview admin / dev proxy. */
export async function readLeadKtpBytes(ktpUrl: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const raw = await readRawKtpObject(ktpUrl);
  return { buffer: raw.buffer, contentType: raw.contentType };
}
