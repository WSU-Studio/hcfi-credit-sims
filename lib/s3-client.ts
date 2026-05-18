import { S3Client } from '@aws-sdk/client-s3';

export function getS3Region(): string {
  const region = process.env.AWS_REGION?.trim();
  if (!region) throw new Error('Set AWS_REGION');
  return region;
}

export function getS3Bucket(): string {
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  if (!bucket) throw new Error('Set AWS_S3_BUCKET');
  return bucket;
}

/**
 * S3 client: explicit keys when set (local dev), otherwise default chain (EC2 IAM role + VPC endpoint).
 */
export function getS3Client(): S3Client {
  const region = getS3Region();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (accessKeyId && secretAccessKey) {
    return new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  if (accessKeyId || secretAccessKey) {
    throw new Error(
      'AWS_ACCESS_KEY_ID dan AWS_SECRET_ACCESS_KEY harus keduanya di-set, atau keduanya dikosongkan (pakai IAM role EC2)'
    );
  }

  return new S3Client({ region });
}

export function getPublicS3Url(key: string, bucket?: string, region?: string): string {
  const b = bucket ?? getS3Bucket();
  const r = region ?? getS3Region();
  return `https://${b}.s3.${r}.amazonaws.com/${key}`;
}
