import { Agent, fetch as undiciFetch } from 'undici';
import { NextRequest, NextResponse } from 'next/server';
import {
  mockApi,
  isMockModeEnabled,
  simulateDelay,
  shouldNotUseMockFallback,
  PRODUCTION_DATA_ERROR_MESSAGE,
} from '@/lib/mock-api';
import { getHyundaiRequestHeaders, API_BASE_URL } from '@/lib/hyundai-api-client';

const CONNECT_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 60_000;

const hyundaiAgent = new Agent({
  connectTimeout: CONNECT_TIMEOUT_MS,
});

// Get List Product From Rule By LeadNo (With Calculation)
// Step 5 (Hasil) memakai API ini untuk daftar produk/tenor.
// Note: This requires a LeadNo which should be created first
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.LeadNo && !body.otrPrice) {
      return NextResponse.json(
        { error: 'LeadNo or otrPrice is required for calculation' },
        { status: 400 }
      );
    }

    // Check if mock mode is enabled
    if (isMockModeEnabled()) {
      await simulateDelay(400);
      const mockResponse = mockApi.getListDefaultProducts({
        LeadNo: body.LeadNo || 'MOCK-LEAD-001',
        otrPrice: body.otrPrice,
      });
      return NextResponse.json(mockResponse);
    }

    // Try real API first
    if (body.LeadNo) {
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
          `${API_BASE_URL}/v1/IntegrationWebsite/GetListProductFromRuleByLeadNo`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ LeadNo: body.LeadNo }),
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
            `[calculate] Hyundai API GetListProductFromRuleByLeadNo returned ${response.status}:`,
            apiMessage ?? text?.slice(0, 200) ?? 'no body'
          );

          // Jika API gagal (mis. LeadNo tidak ada di Hyundai) tapi kita punya otrPrice,
          // kembalikan mock product list agar step 5 tetap menampilkan hasil.
          if (body.otrPrice != null && body.otrPrice > 0) {
            console.warn('[calculate] Fallback ke mock product list (LeadNo mungkin belum dibuat di Hyundai).');
            const mockResponse = mockApi.getListDefaultProducts({
              LeadNo: body.LeadNo,
              otrPrice: body.otrPrice,
            });
            return NextResponse.json({ ...mockResponse, dataSource: 'mock' });
          }

          throw new Error(apiMessage || 'Failed to calculate products');
        }

        return NextResponse.json(data);
      } catch (apiError: unknown) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('Real API error:', apiError);

        // Fallback ke mock bila ada otrPrice (mis. network error tapi form sudah isi)
        if (body.otrPrice != null && body.otrPrice > 0) {
          console.warn('[calculate] Fallback ke mock product list setelah error.');
          const mockResponse = mockApi.getListDefaultProducts({
            LeadNo: body.LeadNo || 'MOCK-LEAD-001',
            otrPrice: body.otrPrice,
          });
          return NextResponse.json({ ...mockResponse, dataSource: 'mock' });
        }

        if (shouldNotUseMockFallback()) {
          return NextResponse.json(
            { error: PRODUCTION_DATA_ERROR_MESSAGE },
            { status: 503 }
          );
        }
        // Fall through to mock API
      }
    }

    // Fallback to mock API
    await simulateDelay(400);
    const mockResponse = mockApi.getListDefaultProducts({
      LeadNo: body.LeadNo || 'MOCK-LEAD-001',
      otrPrice: body.otrPrice,
    });
    return NextResponse.json(mockResponse);
  } catch (error: unknown) {
    console.error('Error calculating products:', error);
    if (shouldNotUseMockFallback()) {
      return NextResponse.json(
        { error: PRODUCTION_DATA_ERROR_MESSAGE },
        { status: 503 }
      );
    }
    try {
      const mockResponse = mockApi.getListDefaultProducts({
        LeadNo: 'MOCK-LEAD-001',
        otrPrice: 500000000,
      });
      return NextResponse.json(mockResponse);
    } catch {
      return NextResponse.json(
        { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }
}
