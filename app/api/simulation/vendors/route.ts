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

// Get List Vendor And Vendor City
export async function POST(request: NextRequest) {
  // Check if mock mode is enabled
  if (isMockModeEnabled()) {
    await simulateDelay(300);
    const body = await request.json();
    const mockResponse = mockApi.getVendorsAndCities({
      hasAvailableAssetOnly: body.hasAvailableAssetOnly ?? true,
      hasCmoAssignedOnly: body.hasCmoAssignedOnly ?? true,
    });
    return NextResponse.json(mockResponse);
  }

  let timeoutId: NodeJS.Timeout | null = null;

  try {
    const body = await request.json();

    // 1. Dapatkan token dulu via Auth (Login); 2. Baru panggil API data dengan token
    const headers = await getHyundaiRequestHeaders();
    if (!headers['AdInsKey']) {
      console.error('Vendors: tidak ada token (Login gagal atau belum). Pastikan Auth API sukses.');
      return NextResponse.json(
        { error: PRODUCTION_DATA_ERROR_MESSAGE },
        { status: 503 }
      );
    }

    // Increase timeout for API calls (30 seconds)
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_BASE_URL}/Foundation/v1/VendorObX/GetListVendorAndVendorCity`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        hasAvailableAssetOnly: body.hasAvailableAssetOnly ?? true,
        hasCmoAssignedOnly: body.hasCmoAssignedOnly ?? true,
      }),
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

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
          : data.Message || 'Failed to fetch vendors';
      return NextResponse.json(
        { error: message },
        { status: response.status }
      );
    }

    return NextResponse.json(data as Record<string, unknown>);
  } catch (error: unknown) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error('Error fetching vendors:', error);
    if (shouldNotUseMockFallback()) {
      return NextResponse.json(
        { error: PRODUCTION_DATA_ERROR_MESSAGE },
        { status: 503 }
      );
    }
    try {
      const mockResponse = mockApi.getVendorsAndCities({
        hasAvailableAssetOnly: true,
        hasCmoAssignedOnly: true,
      });
      return NextResponse.json(mockResponse);
    } catch (mockError) {
      console.error('Error fetching vendors:', mockError);
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
}
