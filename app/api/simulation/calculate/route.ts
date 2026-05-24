import { Agent, fetch as undiciFetch } from 'undici';
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

const CONNECT_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 60_000;

const hyundaiAgent = new Agent({
  connectTimeout: CONNECT_TIMEOUT_MS,
});

/**
 * GetListDefaultProductFromRuleByLeadNo (Postman v1.1, Fase 2 — Financial Data).
 * Step 5 (Hasil) memakai API ini untuk daftar produk standard/promotion berdasarkan LeadNo riil
 * yang sudah dibuat di PriceStep via /api/simulation/lead-asset.
 */
function isMockLeadNo(leadNo?: string | null): boolean {
  if (!leadNo) return false;
  return leadNo.startsWith('MOCK-LEAD-') || leadNo.startsWith('FAILED-');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const leadNo: string | undefined = body.LeadNo || body.leadNo;
    const otrPrice: number | undefined = body.otrPrice;

    if (!leadNo && !otrPrice) {
      return NextResponse.json(
        { error: 'LeadNo or otrPrice is required for calculation' },
        { status: 400 }
      );
    }

    const siteMock = await getMockApiSettings();
    const mockEnabled = siteMock.enabled || isMockModeEnabled();

    if (mockEnabled || isMockLeadNo(leadNo)) {
      await simulateDelay(400);
      const custom = siteMock.content?.calculate;
      if (
        custom &&
        Array.isArray(custom.ListDefaultStandardProductObj) &&
        custom.ListDefaultStandardProductObj.length > 0
      ) {
        return NextResponse.json({
          ListDefaultStandardProductObj: custom.ListDefaultStandardProductObj,
          ListDefaultPromotionProductObj: Array.isArray(custom.ListDefaultPromotionProductObj)
            ? custom.ListDefaultPromotionProductObj
            : [],
          dataSource: 'mock-site-settings',
        });
      }
      const mockResponse = mockApi.getListDefaultProducts({
        LeadNo: leadNo || 'MOCK-LEAD-001',
        otrPrice,
      });
      return NextResponse.json({ ...mockResponse, dataSource: 'mock' });
    }

    if (!leadNo) {
      return NextResponse.json(
        { error: 'LeadNo wajib untuk memuat produk simulasi.' },
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

    let timeoutId: NodeJS.Timeout | null = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await undiciFetch(
        `${API_BASE_URL}/v1/IntegrationWebsite/GetListDefaultProductFromRuleByLeadNo`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            requestDateTime: new Date().toISOString(),
            rowVersion: '',
            leadNo,
            LeadNo: leadNo,
          }),
          signal: controller.signal,
          dispatcher: hyundaiAgent,
        }
      );

      if (timeoutId) clearTimeout(timeoutId);

      const text = await response.text();
      let data: unknown;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error('Invalid response from calculate API');
      }

      if (!response.ok) {
        const apiMessage =
          data && typeof data === 'object' && 'Message' in data
            ? (data as { Message?: string }).Message
            : null;
        console.error(
          `[calculate] Hyundai GetListDefaultProductFromRuleByLeadNo returned ${response.status}:`,
          apiMessage ?? text?.slice(0, 200) ?? 'no body'
        );
        throw new Error(apiMessage || 'Gagal memuat produk kredit dari Hyundai.');
      }

      return NextResponse.json(data);
    } catch (apiError: unknown) {
      if (timeoutId) clearTimeout(timeoutId);
      const rawMessage =
        apiError instanceof Error
          ? apiError.message
          : 'Gagal memuat produk kredit dari Hyundai.';
      const errorId = extractHyundaiErrorId(apiError);
      console.error(
        '[calculate] Hyundai GetListDefaultProductFromRuleByLeadNo error:',
        errorId ? `(Error ID: ${errorId})` : '',
        rawMessage
      );

      if (shouldNotUseMockFallback()) {
        return NextResponse.json(
          {
            error: toUserFacingHyundaiError(apiError, PRODUCTION_DATA_ERROR_MESSAGE),
            errorId,
          },
          { status: 502 }
        );
      }

      // Dev fallback (USE_MOCK_API tidak di-set 'false') — supaya UX tetap demo-able.
      if (otrPrice != null && otrPrice > 0) {
        console.warn('[calculate] Dev fallback ke mock product list setelah error.');
        const mockResponse = mockApi.getListDefaultProducts({
          LeadNo: leadNo,
          otrPrice,
        });
        return NextResponse.json({ ...mockResponse, dataSource: 'mock' });
      }

      return NextResponse.json({ error: rawMessage }, { status: 502 });
    }
  } catch (error: unknown) {
    console.error('Error calculating products:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
