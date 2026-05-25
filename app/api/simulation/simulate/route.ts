import { NextRequest, NextResponse } from 'next/server';
import {
  mockApi,
  isMockModeEnabled,
  simulateDelay,
  shouldNotUseMockFallback,
  PRODUCTION_DATA_ERROR_MESSAGE,
} from '@/lib/mock-api';
import { getMockApiSettings } from '@/lib/site-settings';
import { getHyundaiRequestHeaders, API_BASE_URL } from '@/lib/hyundai-api-client';
import {
  extractHyundaiErrorId,
  toUserFacingHyundaiError,
} from '@/lib/hyundai-known-errors';

/**
 * Hyundai Fase 2 — kalkulasi cicilan per tenor untuk satu produk yang user pilih.
 *
 * NOTE (2026-05-25): kami sengaja memanggil `CalculateProductFromRule` (bukan
 * `SimulateFinancialCalculate`) karena `SimulateFinancialCalculate` di QA env
 * Hyundai mengembalikan HTTP 500 "LINQ query parameter expression" untuk semua
 * kombinasi produk (sudah dilaporkan ke Hyundai, lihat Error ID di history).
 *
 * `CalculateProductFromRule` mengembalikan array tenor (12/24/36/48/60) sekaligus
 * dengan TdpAmt/InstallmentAmt/NtfAmt/EffRatePrcnt lengkap — semua field yang
 * dibutuhkan untuk simulasi awal. Field yang hanya ada di Simulate (mis.
 * `AssetInsAmt`) tidak dipakai untuk display ke user di tahap ini.
 *
 * Body request dari frontend kompatibel: `firstInstallment` & `tenor` tetap
 * diterima (untuk kompatibilitas), tapi tidak diteruskan ke Hyundai karena
 * `CalculateProductFromRule` tidak memerlukannya.
 */
function isMockLeadNo(leadNo?: string | null): boolean {
  if (!leadNo) return false;
  return leadNo.startsWith('MOCK-LEAD-') || leadNo.startsWith('FAILED-');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      otrPrice,
      dpPrcnt,
      productCode,
      productName,
      firstInstallment,
      isPromotion,
    } = body;
    const leadNo: string | undefined = body.leadNo || body.LeadNo;

    if (!otrPrice || dpPrcnt == null || !productCode || !productName) {
      return NextResponse.json(
        {
          error: 'otrPrice, dpPrcnt, productCode, dan productName wajib diisi.',
        },
        { status: 400 }
      );
    }
    // firstInstallment masih diterima untuk kompatibilitas dengan UI, tapi
    // `CalculateProductFromRule` tidak butuh field ini—jadi cukup divalidasi
    // tipenya kalau memang dikirim.
    if (firstInstallment && !['ADDM', 'ADDB'].includes(firstInstallment)) {
      return NextResponse.json(
        { error: 'firstInstallment must be ADDM or ADDB' },
        { status: 400 }
      );
    }

    const siteMock = await getMockApiSettings();
    const mockEnabled = siteMock.enabled || isMockModeEnabled();

    if (mockEnabled || isMockLeadNo(leadNo)) {
      await simulateDelay(400);
      const custom = siteMock.content?.simulate;
      if (custom && Array.isArray(custom.ListProductObj) && custom.ListProductObj.length > 0) {
        return NextResponse.json({ ...custom, dataSource: 'mock-site-settings' });
      }
      const res = mockApi.calculateProductFromRule({
        otrPrice: Number(otrPrice),
        dpPrcnt: Number(dpPrcnt),
        productCode: String(productCode),
        productName: String(productName),
        firstInstallment: (firstInstallment as 'ADDM' | 'ADDB') ?? 'ADDM',
      });
      return NextResponse.json({ ...res, dataSource: 'mock' });
    }

    if (!leadNo) {
      return NextResponse.json(
        { error: 'LeadNo wajib untuk simulasi finansial.' },
        { status: 400 }
      );
    }

    const headers = await getHyundaiRequestHeaders();
    if (!headers.AdInsKey && shouldNotUseMockFallback()) {
      return NextResponse.json(
        { error: PRODUCTION_DATA_ERROR_MESSAGE },
        { status: 503 }
      );
    }

    try {
      const res = await fetch(`${API_BASE_URL}/v1/IntegrationWebsite/CalculateProductFromRule`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          requestDateTime: new Date().toISOString(),
          rowVersion: '',
          LeadNo: leadNo,
          DpPrcnt: Number(dpPrcnt),
          DpAmt: Math.round(Number(otrPrice) * (Number(dpPrcnt) / 100)),
          ProductCode: productCode,
          ProductName: productName,
          IsPromotion: Boolean(isPromotion),
        }),
      });

      const text = await res.text();
      let data: unknown;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        const apiMessage = (data && typeof data === 'object' && 'Message' in data)
          ? (data as { Message?: string }).Message
          : null;
        console.warn(
          `[simulate] Hyundai CalculateProductFromRule returned ${res.status}:`,
          apiMessage ?? text?.slice(0, 200) ?? 'no body'
        );
        throw new Error(String(apiMessage || 'Calculate failed'));
      }

      return NextResponse.json(data);
    } catch (e) {
      const rawMessage = e instanceof Error ? e.message : 'Calculate failed';
      const errorId = extractHyundaiErrorId(e);
      console.warn(
        '[simulate] CalculateProductFromRule failed:',
        errorId ? `(Hyundai Error ID: ${errorId})` : '',
        rawMessage
      );

      if (shouldNotUseMockFallback()) {
        return NextResponse.json(
          {
            error: toUserFacingHyundaiError(e, PRODUCTION_DATA_ERROR_MESSAGE),
            errorId,
          },
          { status: 502 }
        );
      }

      // Dev fallback supaya UX tetap demo-able (USE_MOCK_API tidak di-set 'false').
      await simulateDelay(400);
      const mockResult = mockApi.calculateProductFromRule({
        otrPrice: Number(otrPrice),
        dpPrcnt: Number(dpPrcnt),
        productCode: String(productCode),
        productName: String(productName),
        firstInstallment: (firstInstallment as 'ADDM' | 'ADDB') ?? 'ADDM',
      });
      return NextResponse.json({ ...mockResult, dataSource: 'mock' });
    }
  } catch (err: unknown) {
    console.error('[simulate] handler error:', err);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
