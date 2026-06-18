/**
 * Map raw AWS S3 errors ke pesan yang aman ditampilkan ke end user.
 * Detail teknis tetap di-log di server.
 */
export function toUserFacingS3Error(raw: string): string {
  const m = raw.toLowerCase();

  if (
    m.includes('access key id') &&
    (m.includes('does not exist') || m.includes('invalidaccesskeyid'))
  ) {
    return 'Upload KTP gagal: kredensial penyimpanan file tidak valid. Hubungi administrator.';
  }

  if (m.includes('signaturedoesnotmatch') || m.includes('signature we calculated')) {
    return 'Upload KTP gagal: kredensial penyimpanan file tidak valid. Hubungi administrator.';
  }

  if (m.includes('accessdenied') || m.includes('not authorized') || m.includes('403')) {
    return 'Upload KTP gagal: izin penyimpanan file ditolak. Hubungi administrator.';
  }

  if (m.includes('nosuchbucket')) {
    return 'Upload KTP gagal: bucket penyimpanan tidak ditemukan. Hubungi administrator.';
  }

  if (m.includes('set aws_region') || m.includes('set aws_s3_bucket')) {
    return 'Upload KTP gagal: penyimpanan file belum dikonfigurasi. Hubungi administrator.';
  }

  if (m.includes('network') || m.includes('timeout') || m.includes('econnrefused')) {
    return 'Upload KTP gagal: tidak bisa terhubung ke server penyimpanan. Coba lagi.';
  }

  return 'Upload KTP gagal. Silakan coba lagi atau hubungi administrator.';
}
