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
import type { AssetMaster, Vendor } from '@/app/types/credit-simulation';

const CONNECT_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 60_000;

const hyundaiAgent = new Agent({
  connectTimeout: CONNECT_TIMEOUT_MS,
});

function deduplicateAssetsByCode(assets: AssetMaster[]): AssetMaster[] {
  const byCode = new Map<string, AssetMaster>();
  for (const item of assets) {
    const existing = byCode.get(item.AssetCode);
    if (!existing) {
      byCode.set(item.AssetCode, item);
      continue;
    }
    // Keep the lowest starting price when same model exists in multiple dealers
    if ((item.Price ?? Number.MAX_SAFE_INTEGER) < (existing.Price ?? Number.MAX_SAFE_INTEGER)) {
      byCode.set(item.AssetCode, item);
    }
  }
  return Array.from(byCode.values());
}

async function fetchAssetsByDealer(
  dealerCode: string,
  headers: Record<string, string>,
  getLatestAsset: boolean
): Promise<AssetMaster[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await undiciFetch(
      `${API_BASE_URL}/Foundation/v1/AssetMasterX/GetAllAssetMasterLvl2AndStartingPrice`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          AssetHierarchyLv1Code: 'HYUNDAI',
          CmoEmpNo: '',
          DealerCode: dealerCode,
          GetLatestAsset: getLatestAsset,
        }),
        signal: controller.signal,
        dispatcher: hyundaiAgent,
      }
    );
    const text = await response.text();
    if (!response.ok) return [];
    const data = text ? JSON.parse(text) : {};
    const assets = (data as { ListAssetMasterObj?: AssetMaster[] }).ListAssetMasterObj;
    return Array.isArray(assets) ? assets : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchGlobalAssets(headers: Record<string, string>, getLatestAsset: boolean): Promise<AssetMaster[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const vendorsResponse = await undiciFetch(
      `${API_BASE_URL}${HYUNDAI_VENDOR_LIST_PATH}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(
          buildHyundaiVendorListBody({
            hasAvailableAssetOnly: true,
            hasCmoAssignedOnly: true,
          })
        ),
        signal: controller.signal,
        dispatcher: hyundaiAgent,
      }
    );

    const text = await vendorsResponse.text();
    if (!vendorsResponse.ok) return [];
    const vendorsData = text ? JSON.parse(text) : {};
    const vendors = ((vendorsData as { ReturnObject?: Vendor[] }).ReturnObject || [])
      .map((v) => v.VendorCode)
      .filter(Boolean);

    if (vendors.length === 0) return [];

    // Process a limited subset to keep response fast and stable.
    const sampledVendors = vendors.slice(0, 8);
    const allAssets = await Promise.all(
      sampledVendors.map((dealerCode) => fetchAssetsByDealer(dealerCode, headers, getLatestAsset))
    );
    return deduplicateAssetsByCode(allAssets.flat());
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

// Get All Asset Master Lv2 with Starting Price
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const useGlobalCatalog = body.GlobalCatalog === true;
  const payload = {
    AssetHierarchyLv1Code: 'HYUNDAI' as const,
    CmoEmpNo: body.CmoEmpNo || '',
    DealerCode: body.DealerCode as string,
    GetLatestAsset: body.GetLatestAsset ?? true,
  };

  const siteMock = await getMockApiSettings();
  if (isMockApiActive(siteMock.enabled)) {
    await simulateDelay(300);
    const mockResponse = mockApi.getAssetMasters(payload);
    if (useGlobalCatalog) {
      const list = (mockResponse.ListAssetMasterObj || []) as AssetMaster[];
      return NextResponse.json({
        ...mockResponse,
        ListAssetMasterObj: deduplicateAssetsByCode(list),
      });
    }
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

    if (useGlobalCatalog) {
      const assets = await fetchGlobalAssets(headers, payload.GetLatestAsset);
      if (assets.length > 0) {
        return NextResponse.json({
          ListAssetMasterObj: assets,
          HeaderObj: {
            ResponseTime: 'N/A',
            StatusCode: '200',
            Message: 'Success',
            ErrorMessages: null,
          },
          StatusCode: '200',
          Message: 'Success',
          ErrorMessages: null,
          RowVersion: null,
        });
      }
    }

    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await undiciFetch(
      `${API_BASE_URL}/Foundation/v1/AssetMasterX/GetAllAssetMasterLvl2AndStartingPrice`,
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
        { error: 'Invalid response from asset API' },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const errMsg =
        data && typeof data === 'object' && 'Message' in data
          ? String((data as { Message?: string }).Message)
          : 'Failed to fetch assets';
      return NextResponse.json(
        { error: errMsg },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error('Error fetching assets:', error);
    if (shouldNotUseMockFallback()) {
      return NextResponse.json(
        { error: PRODUCTION_DATA_ERROR_MESSAGE },
        { status: 503 }
      );
    }
    try {
      const mockResponse = mockApi.getAssetMasters(payload);
      if (useGlobalCatalog) {
        const list = (mockResponse.ListAssetMasterObj || []) as AssetMaster[];
        return NextResponse.json({
          ...mockResponse,
          ListAssetMasterObj: deduplicateAssetsByCode(list),
        });
      }
      return NextResponse.json(mockResponse);
    } catch (mockError) {
      console.error('Error fetching assets:', mockError);
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
