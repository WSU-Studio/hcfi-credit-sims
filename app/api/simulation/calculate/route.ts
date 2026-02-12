import { NextRequest, NextResponse } from 'next/server';
import {
  mockApi,
  isMockModeEnabled,
  simulateDelay,
  shouldNotUseMockFallback,
  PRODUCTION_DATA_ERROR_MESSAGE,
} from '@/lib/mock-api';
import { getHyundaiRequestHeaders, API_BASE_URL } from '@/lib/hyundai-api-client';

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
      try {
        const response = await fetch(
          `${API_BASE_URL}/v1/IntegrationWebsite/GetListProductFromRuleByLeadNo`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ LeadNo: body.LeadNo }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            (data && typeof data === 'object' && 'Message' in data
              ? (data as { Message?: string }).Message
              : null) || 'Failed to calculate products'
          );
        }

        return NextResponse.json(data);
      } catch (apiError: unknown) {
        console.error('Real API error:', apiError);
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
