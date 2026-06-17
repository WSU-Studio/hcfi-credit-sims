import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import { validateImageFile } from '@/lib/image-utils';
import { prepareImageForOcr } from '@/lib/ocr-image-prepare';
import {
  buildOcrKtpRequest,
  analyzeOcrKtpResponse,
} from '@/lib/hyundai-ocr';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB — sejajar dengan upload KTP user

async function assertLeadOcrTest() {
  // Sengaja pakai 'view' (bukan 'create' / permission terpisah) supaya admin
  // yang sudah punya akses melihat halaman OCR otomatis bisa pakai tool ini —
  // tidak perlu rilis migrasi permission baru. Kalau nanti mau diperketat,
  // tinggal ganti ke ('LEAD_OCR', 'create') / permission khusus.
  try {
    await requirePermission('LEAD_OCR', 'view');
  } catch {
    await requirePermission('LEADS', 'view');
  }
}

/**
 * POST /api/admin/lead-ocr/test
 *
 * Tool diagnostik untuk menguji endpoint Hyundai `GetOCRKTPData` secara
 * mandiri — TIDAK menyentuh DB (tidak bikin record `Lead` / `LeadOcrResult`)
 * dan TIDAK trigger flow `AddLeadAsset` / `AddLeadCust`. Cocok untuk
 * cek-cepat:
 *   - Apakah token Hyundai masih valid?
 *   - Apakah file KTP user kebaca OCR atau tidak?
 *   - Eksperimen dengan format/kualitas gambar berbeda.
 *
 * Body: multipart/form-data dengan field `file` (image/jpeg|png|gif|webp).
 */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await assertLeadOcrTest();

    const declaredLength = Number(request.headers.get('content-length') ?? '0');
    if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_BYTES + 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 413 });
    }

    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type harus multipart/form-data' },
        { status: 415 }
      );
    }

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

    const sourceContentType = file.type || 'image/jpeg';
    const sourceFileName = file.name || `ktp-${randomUUID()}.jpg`;

    const prepared = await prepareImageForOcr({
      buffer: inputBuffer,
      sourceContentType,
      sourceFileName,
    });

    const trxNoOverride = (formData.get('trxNo') as string | null)?.trim();
    const trxNo = trxNoOverride && trxNoOverride.length > 0
      ? trxNoOverride
      : `TEST-${randomUUID().slice(0, 8).toUpperCase()}`;

    const meta = {
      trxNo,
      sourceFileName: prepared.sourceFileName,
      sourceContentType: prepared.sourceContentType,
      sentFileName: prepared.fileName,
      sentContentType: prepared.contentType,
      sentByteSize: prepared.buffer.length,
      reEncoded: prepared.reEncoded,
    };

    const hyundaiReq = await buildOcrKtpRequest({
      trxNo,
      fileName: prepared.fileName,
      byteBase64: prepared.base64,
    });

    // Expose request bundle yang dikirim ke Hyundai supaya admin bisa
    // replicate di Postman / dikirim ke tim Hyundai untuk debugging.
    // Headers termasuk AdInsKey — tool ini admin-only, jadi OK keluarin token.
    const exportedRequest = {
      url: hyundaiReq.url,
      method: hyundaiReq.method,
      headers: hyundaiReq.headers,
      body: hyundaiReq.body,
    };

    try {
      const fetchRes = await fetch(hyundaiReq.url, {
        method: hyundaiReq.method,
        headers: hyundaiReq.headers,
        body: JSON.stringify(hyundaiReq.body),
      });
      const text = await fetchRes.text();
      const analysis = analyzeOcrKtpResponse(text, fetchRes.ok, fetchRes.status);

      return NextResponse.json({
        category: analysis.category,
        diagnosis: analysis.diagnosis,
        errorMessage: analysis.errorMessage,
        durationMs: Date.now() - startedAt,
        meta,
        read: analysis.data?.Read ?? null,
        rawResponse: analysis.data,
        httpStatus: fetchRes.status,
        request: exportedRequest,
      });
    } catch (networkErr) {
      const message =
        networkErr instanceof Error ? networkErr.message : 'Network error';
      return NextResponse.json({
        category: 'NETWORK_ERROR' as const,
        diagnosis:
          'Tidak bisa menjangkau server Hyundai sama sekali (DNS / TCP / TLS / timeout). Cek internet atau status endpoint mereka.',
        errorMessage: `Gagal kontak Hyundai: ${message}`,
        durationMs: Date.now() - startedAt,
        meta,
        read: null,
        rawResponse: null,
        httpStatus: null,
        request: exportedRequest,
      });
    }
  } catch (error: unknown) {
    console.error('[admin/lead-ocr/test]', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    const status = /unauthorized/i.test(message)
      ? 401
      : /forbidden|permission/i.test(message)
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
