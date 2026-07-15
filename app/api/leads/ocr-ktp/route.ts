import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { validateImageFile } from '@/lib/image-utils';
import { prepareImageForOcr } from '@/lib/ocr-image-prepare';
import { analyzeOcrKtpResponse, buildOcrKtpRequest } from '@/lib/hyundai-ocr';
import { ocrReadToSnapshot } from '@/lib/ocr-ktp-snapshot';
import { getClientIp, leadsLimiter, tooManyRequestsResponse } from '@/lib/ratelimit';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * POST /api/leads/ocr-ktp
 *
 * Memanggil Hyundai GetOCRKTPData setelah user upload KTP di ContactModal.
 * Tidak menyimpan ke DB — hasilnya ditinjau user lalu dikirim bersama POST /api/leads.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = leadsLimiter.limit(`ocr-ktp:${ip}`);
  if (!rl.success) {
    return tooManyRequestsResponse(
      'Terlalu banyak permintaan OCR. Silakan coba lagi beberapa saat.',
      rl.retryAfterSec
    );
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_BYTES + 1024) {
    return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 413 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'Content-Type harus multipart/form-data' }, { status: 415 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'File KTP wajib diisi' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 413 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const validation = validateImageFile(inputBuffer);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const prepared = await prepareImageForOcr({
      buffer: inputBuffer,
      sourceContentType: file.type || 'image/jpeg',
      sourceFileName: file.name || `ktp-${randomUUID()}.jpg`,
    });

    const trxNo = `WEB-${randomUUID().slice(0, 8).toUpperCase()}`;
    const hyundaiReq = await buildOcrKtpRequest({
      trxNo,
      fileName: prepared.fileName,
      byteBase64: prepared.base64,
    });

    const fetchRes = await fetch(hyundaiReq.url, {
      method: hyundaiReq.method,
      headers: hyundaiReq.headers,
      body: JSON.stringify(hyundaiReq.body),
    });
    const text = await fetchRes.text();
    const analysis = analyzeOcrKtpResponse(text, fetchRes.ok, fetchRes.status);
    const read = analysis.data?.Read ?? null;

    return NextResponse.json({
      category: analysis.category,
      userMessage: analysis.userMessage,
      errorMessage: analysis.errorMessage ?? analysis.userMessage,
      snapshot: ocrReadToSnapshot(read),
      read,
    });
  } catch (error: unknown) {
    console.error('[leads/ocr-ktp]', error);
    return NextResponse.json(
      {
        error:
          'Gagal membaca data KTP. Silakan coba lagi, atau unggah ulang foto yang lebih jelas.',
      },
      { status: 500 }
    );
  }
}
