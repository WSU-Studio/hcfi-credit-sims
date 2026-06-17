import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getS3Bucket, getS3Client } from '@/lib/s3-client';
import { extractBucketAndKeyFromS3Url, isLeadKtpS3Key } from '@/lib/s3-url';
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

/**
 * Tarik object KTP dari S3 lalu normalisasi format supaya OCR Hyundai bisa
 * decode (lihat lib/ocr-image-prepare.ts untuk konteks WebP→JPEG).
 *
 * Kasus 2026-06-03 — LeadNo 13STGLD20260600008 (John Doe):
 *   ktpUrl = .../*.webp → OCR sukses HTTP 200 tapi `Read` null → IdNo masuk
 *   sebagai "0000000000000000" placeholder.
 */
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

  const prepared = await prepareImageForOcr({
    buffer: rawBuffer,
    sourceContentType,
    sourceFileName,
  });

  return {
    buffer: prepared.buffer,
    contentType: prepared.contentType,
    fileName: prepared.fileName,
    base64: prepared.base64,
  };
}
