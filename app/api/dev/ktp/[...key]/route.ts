import { NextRequest, NextResponse } from 'next/server';
import { readLocalKtpFile } from '@/lib/local-ktp-storage';
import { isLocalKtpStorageEnabled } from '@/lib/ktp-storage-mode';
import { isLeadKtpS3Key } from '@/lib/s3-url';

/**
 * Dev-only proxy untuk KTP lokal (`KTP_STORAGE=local`).
 * URL ini disimpan sebagai `Lead.ktpUrl` saat upload di localhost.
 * Disabled in production regardless of KTP_STORAGE misconfiguration.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  if (process.env.NODE_ENV === 'production' || !isLocalKtpStorageEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { key: segments } = await params;
  if (!Array.isArray(segments) || segments.length < 2) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const key = segments.map((s) => decodeURIComponent(s)).join('/');
  if (!isLeadKtpS3Key(key)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const { buffer, contentType } = await readLocalKtpFile(key);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
