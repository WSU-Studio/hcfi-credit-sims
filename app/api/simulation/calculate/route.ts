import { NextRequest, NextResponse } from 'next/server';
import {
  mockApi,
  isMockModeEnabled,
  simulateDelay,
  shouldNotUseMockFallback,
  PRODUCTION_DATA_ERROR_MESSAGE,
} from '@/lib/mock-api';
import {
  CREDIT_SIMULATION_API_BASE_URL as API_BASE_URL,
  getHyundaiRequestHeaders,
  clearHyundaiTokenCache,
} from '@/lib/hyundai-api-client';

// Get List Product From Rule By LeadNo (With Calculation)
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
      return NextResponse.json({ ...mockResponse, dataSource: 'mock' });
    }

    // Try real API first (perlu token dari Auth dulu)
    if (body.LeadNo) {
      try {
        const headers = await getHyundaiRequestHeaders();
        if (!headers['AdInsKey']) {
          return NextResponse.json(
            { error: PRODUCTION_DATA_ERROR_MESSAGE },
            { status: 503 }
          );
        }
        const response = await fetch(`${API_BASE_URL}/v1/IntegrationWebsite/GetListProductFromRuleByLeadNo`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            LeadNo: body.LeadNo,
          }),
        });

        const text = await response.text();
        let data: { Message?: string } = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          if (!response.ok || shouldNotUseMockFallback()) {
            if (response.status === 401) clearHyundaiTokenCache();
            return NextResponse.json(
              { error: PRODUCTION_DATA_ERROR_MESSAGE },
              { status: 503 }
            );
          }
          throw new Error('Response bukan JSON');
        }

        if (!response.ok) {
          if (response.status === 401) clearHyundaiTokenCache();
          if (shouldNotUseMockFallback()) {
            return NextResponse.json(
              { error: PRODUCTION_DATA_ERROR_MESSAGE },
              { status: 503 }
            );
          }
          throw new Error(data.Message || 'Failed to calculate products');
        }

        return NextResponse.json({ ...data, dataSource: 'hyundai' });
      } catch (apiError: unknown) {
        console.error('Real API error, falling back to mock:', apiError);
        if (shouldNotUseMockFallback()) {
          return NextResponse.json(
            { error: PRODUCTION_DATA_ERROR_MESSAGE },
            { status: 503 }
          );
        }
        // Fall through to mock API
      }
    }

    // Fallback to mock API (dev only)
    if (shouldNotUseMockFallback()) {
      return NextResponse.json(
        { error: PRODUCTION_DATA_ERROR_MESSAGE },
        { status: 503 }
      );
    }
    await simulateDelay(400);
    const mockResponse = mockApi.getListDefaultProducts({
      LeadNo: body.LeadNo || 'MOCK-LEAD-001',
      otrPrice: body.otrPrice,
    });
    return NextResponse.json({ ...mockResponse, dataSource: 'mock' });
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
      return NextResponse.json({ ...mockResponse, dataSource: 'mock' });
    } catch {
      return NextResponse.json(
        { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }
}
