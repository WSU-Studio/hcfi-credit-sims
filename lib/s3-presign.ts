import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/** Virtual-hosted–style: bucket.s3.region.amazonaws.com */
const VIRTUAL_HOSTED = /^([^.]+)\.s3\.([^.]+)\.amazonaws\.com$/;

function getS3Client(): S3Client | null {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
}

/**
 * If `objectUrl` points at our configured bucket (private objects), return a short-lived GET URL.
 * Otherwise return the original string (public URLs, other hosts).
 */
export async function presignGetUrlIfOurBucket(
  objectUrl: string,
  expiresInSeconds = 3600
): Promise<string> {
  const trimmed = objectUrl.trim();
  if (!trimmed) return trimmed;

  let hostname: string;
  let key: string;
  try {
    const u = new URL(trimmed);
    hostname = u.hostname;
    key = decodeURIComponent(u.pathname.replace(/^\//, ''));
  } catch {
    return trimmed;
  }

  const m = hostname.match(VIRTUAL_HOSTED);
  if (!m || !key) return trimmed;

  const urlBucket = m[1];
  const envBucket = process.env.AWS_S3_BUCKET;
  if (!envBucket || urlBucket !== envBucket) return trimmed;

  const client = getS3Client();
  if (!client) return trimmed;

  try {
    const command = new GetObjectCommand({ Bucket: urlBucket, Key: key });
    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } catch (err) {
    console.error('[s3-presign] getSignedUrl failed', err);
    return trimmed;
  }
}
