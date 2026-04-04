const KTP_PREFIX = 'hcfi_leads_ktp/';

/**
 * Parse virtual-hosted S3 URL: https://bucket.s3.region.amazonaws.com/key
 * Returns bucket + key; does not verify bucket matches env (caller checks).
 */
export function extractBucketAndKeyFromS3Url(url: string): { bucket: string; key: string } | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname;
    if (!host.endsWith('.amazonaws.com')) return null;
    const withoutAws = host.slice(0, -'.amazonaws.com'.length);
    const s3Marker = '.s3.';
    const idx = withoutAws.indexOf(s3Marker);
    if (idx <= 0) return null;
    const bucket = withoutAws.slice(0, idx);
    const key = decodeURIComponent(u.pathname.replace(/^\//, ''));
    if (!bucket || !key) return null;
    return { bucket, key };
  } catch {
    return null;
  }
}

export function isLeadKtpS3Key(key: string): boolean {
  return key.startsWith(KTP_PREFIX) && !key.includes('..') && key.length < 512;
}
