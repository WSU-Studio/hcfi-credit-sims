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

// Get List Exterior Color By FSC Code and Manufacturing Year
export async function POST(request: NextRequest) {
  // Check if mock mode is enabled
  if (isMockModeEnabled()) {
    await simulateDelay(200);
    const body = await request.json();
    const mockResponse = mockApi.getExteriorColors({
      FscCode: body.FscCode,
      ManufYear: body.ManufYear,
    });
    return NextResponse.json(mockResponse);
  }

  try {
    const body = await request.json();

    const headers = await getHyundaiRequestHeaders();
    if (!headers['AdInsKey']) {
      return NextResponse.json(
        { error: PRODUCTION_DATA_ERROR_MESSAGE },
        { status: 503 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/Foundation/v1/AssetMasterForMobileX/GetListExteriorColorByFscManufYear`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        FscCode: body.FscCode,
        ManufYear: body.ManufYear,
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
      const message =
        response.status === 401
          ? '401: Unauthorized API Call.'
          : data.Message || 'Failed to fetch exterior colors';
      return NextResponse.json(
        { error: message },
        { status: response.status }
      );
    }

    return NextResponse.json(data as Record<string, unknown>);
  } catch (error: unknown) {
    console.error('Error fetching exterior colors:', error);
    if (shouldNotUseMockFallback()) {
      return NextResponse.json(
        { error: PRODUCTION_DATA_ERROR_MESSAGE },
        { status: 503 }
      );
    }
    try {
      const mockResponse = mockApi.getExteriorColors({
        FscCode: '',
        ManufYear: new Date().getFullYear(),
      });
      return NextResponse.json(mockResponse);
    } catch (mockError) {
      console.error('Error fetching exterior colors:', mockError);
      return NextResponse.json(
        { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }
}
