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
import {
  HYUNDAI_VENDOR_LIST_PATH,
  buildHyundaiVendorListBody,
} from '@/lib/hyundai-vendor-list';
import { getClientIp, simulationLimiter, tooManyRequestsResponse } from '@/lib/ratelimit';
import {
  invalidInputResponse,
  vendorsBodySchema,
} from '@/lib/security/simulation-schemas';

const CONNECT_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 60_000;

const hyundaiAgent = new Agent({
  connectTimeout: CONNECT_TIMEOUT_MS,
});

// Get List Vendor And Vendor City
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
  const parsed = vendorsBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return invalidInputResponse(parsed.error);
  }
  const body = parsed.data;

  const siteMock = await getMockApiSettings();
  // Mock dari Site Settings (centang "Aktifkan Mock API") atau dari env
  if (isMockApiActive(siteMock.enabled)) {
    await simulateDelay(300);
    const mockResponse = mockApi.getVendorsAndCities({
      hasAvailableAssetOnly: body.hasAvailableAssetOnly ?? true,
      hasCmoAssignedOnly: body.hasCmoAssignedOnly ?? true,
    });
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
      `${API_BASE_URL}${HYUNDAI_VENDOR_LIST_PATH}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(
          buildHyundaiVendorListBody({
            hasAvailableAssetOnly: body.hasAvailableAssetOnly,
            hasCmoAssignedOnly: body.hasCmoAssignedOnly,
            supplierBrandCode: body.supplierBrandCode || undefined,
          })
        ),
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
        { error: 'Invalid response from vendor API' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const errMsg =
        data && typeof data === 'object' && 'Message' in data
          ? String((data as { Message?: string }).Message)
          : 'Failed to fetch vendors';
      return NextResponse.json(
        { error: errMsg },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
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
        hasCmoAssignedOnly: false,
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
