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
import { getClientIp, simulationLimiter, tooManyRequestsResponse } from '@/lib/ratelimit';
import {
  interiorColorsBodySchema,
  invalidInputResponse,
} from '@/lib/security/simulation-schemas';

const CONNECT_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 60_000;

const hyundaiAgent = new Agent({
  connectTimeout: CONNECT_TIMEOUT_MS,
});

// Get List Interior Color By FSC Code, Manufacturing Year, and Exterior Color
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = simulationLimiter.limit(ip);
  if (!rl.success) {
    return tooManyRequestsResponse(
      'Terlalu banyak permintaan. Silakan coba lagi sebentar.',
      rl.retryAfterSec
    );
  }

  const rawBody = await request.json().catch(() => ({}));
  const parsed = interiorColorsBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return invalidInputResponse(parsed.error);
  }
  const payload = {
    FscCode: parsed.data.FscCode,
    ManufYear: parsed.data.ManufYear,
    ExtColorCode: parsed.data.ExtColorCode,
  };

  const siteMock = await getMockApiSettings();
  if (isMockApiActive(siteMock.enabled)) {
    await simulateDelay(200);
    const mockResponse = mockApi.getInteriorColors(payload);
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
      `${API_BASE_URL}/Foundation/v1/AssetMasterForMobileX/GetListInteriorColorByFscManufYearExtColor`,
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
        { error: 'Invalid response from interior colors API' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const errMsg =
        data && typeof data === 'object' && 'Message' in data
          ? String((data as { Message?: string }).Message)
          : 'Failed to fetch interior colors';
      return NextResponse.json(
        { error: errMsg },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error('Error fetching interior colors:', error);
    if (shouldNotUseMockFallback()) {
      return NextResponse.json(
        { error: PRODUCTION_DATA_ERROR_MESSAGE },
        { status: 503 }
      );
    }
    try {
      const mockResponse = mockApi.getInteriorColors(payload);
      return NextResponse.json(mockResponse);
    } catch (mockError) {
      console.error('Error fetching interior colors:', mockError);
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
