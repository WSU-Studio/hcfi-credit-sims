import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { extractBucketAndKeyFromS3Url, isLeadKtpS3Key } from '@/lib/s3-url';

function getS3Client(): S3Client {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing AWS env for S3');
  }
  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

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
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  if (!bucket) throw new Error('AWS_S3_BUCKET not configured');

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
