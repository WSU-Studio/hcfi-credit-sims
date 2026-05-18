import { GetObjectCommand } from '@aws-sdk/client-s3';
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

  const buffer = await bodyToBuffer(out.Body);
  const contentType = out.ContentType ?? 'image/webp';
  const fileName = parsed.key.split('/').pop() ?? 'ktp.webp';
  const base64 = buffer.toString('base64');

  return { buffer, contentType, fileName, base64 };
}
