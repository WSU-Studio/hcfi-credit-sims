import { Agent, fetch as undiciFetch } from 'undici';
import { NextRequest, NextResponse } from 'next/server';
import {
  mockApi,
  isMockApiActive,
  simulateDelay,
  shouldNotUseMockFallback,
  PRODUCTION_DATA_ERROR_MESSAGE,
} from '@/lib/mock-api';
import { getMockApiSettings } from '@/lib/site-settings';
import { getHyundaiRequestHeaders, API_BASE_URL } from '@/lib/hyundai-api-client';

const CONNECT_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 60_000;

const hyundaiAgent = new Agent({
  connectTimeout: CONNECT_TIMEOUT_MS,
});

// Get List Exterior Color By FSC Code and Manufacturing Year
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const payload = {
    FscCode: body.FscCode as string,
    ManufYear: body.ManufYear as number,
  };

  const siteMock = await getMockApiSettings();
  if (isMockApiActive(siteMock.enabled)) {
    await simulateDelay(200);
    const mockResponse = mockApi.getExteriorColors(payload);
    return NextResponse.json(mockResponse);
  }

  let timeoutId: NodeJS.Timeout | null = null;

  try {
    const headers = await getHyundaiRequestHeaders();
    if (!headers.AdInsKey && shouldNotUseMockFallback()) {
      return NextResponse.json(
        { error: PRODUCTION_DATA_ERROR_MESSAGE },
        { status: 503 }
      );
    }

    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await undiciFetch(
      `${API_BASE_URL}/Foundation/v1/AssetMasterForMobileX/GetListExteriorColorByFscManufYear`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
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
      return NextResponse.json(
        { error: 'Invalid response from exterior colors API' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const errMsg =
        data && typeof data === 'object' && 'Message' in data
          ? String((data as { Message?: string }).Message)
          : 'Failed to fetch exterior colors';
      return NextResponse.json(
        { error: errMsg },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error('Error fetching exterior colors:', error);
    if (shouldNotUseMockFallback()) {
      return NextResponse.json(
        { error: PRODUCTION_DATA_ERROR_MESSAGE },
        { status: 503 }
      );
    }
    try {
      const mockResponse = mockApi.getExteriorColors(payload);
      return NextResponse.json(mockResponse);
    } catch (mockError) {
      console.error('Error fetching exterior colors:', mockError);
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
