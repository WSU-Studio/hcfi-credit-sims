import { NextRequest, NextResponse } from 'next/server';
import {
  mockApi,
  isMockModeEnabled,
  simulateDelay,
  shouldNotUseMockFallback,
  PRODUCTION_DATA_ERROR_MESSAGE,
} from '@/lib/mock-api';
import { getHyundaiRequestHeaders, API_BASE_URL } from '@/lib/hyundai-api-client';

/**
 * SimulateFinancialCalculate / CalculateProductFromRule
 * Body: otrPrice, dpPrcnt, productCode, productName, firstInstallment (ADDM|ADDB)
 * Returns ListProductObj (rows per tenor 12,24,36,48,60; 5050 only 12)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otrPrice, dpPrcnt, productCode, productName, firstInstallment } = body;

    if (!otrPrice || dpPrcnt == null || !productCode || !productName || !firstInstallment) {
      return NextResponse.json(
        {
          error:
            'otrPrice, dpPrcnt, productCode, productName, and firstInstallment (ADDM|ADDB) are required',
        },
        { status: 400 }
      );
    }
    if (!['ADDM', 'ADDB'].includes(firstInstallment)) {
      return NextResponse.json(
        { error: 'firstInstallment must be ADDM or ADDB' },
        { status: 400 }
      );
    }

    if (isMockModeEnabled()) {
      await simulateDelay(400);
      const res = mockApi.calculateProductFromRule({
        otrPrice: Number(otrPrice),
        dpPrcnt: Number(dpPrcnt),
        productCode: String(productCode),
        productName: String(productName),
        firstInstallment: firstInstallment as 'ADDM' | 'ADDB',
      });
      return NextResponse.json(res);
    }

    const headers = await getHyundaiRequestHeaders();
    if (!headers.AdInsKey && shouldNotUseMockFallback()) {
      return NextResponse.json(
        { error: PRODUCTION_DATA_ERROR_MESSAGE },
        { status: 503 }
      );
    }

    try {
      const res = await fetch(`${API_BASE_URL}/v1/IntegrationWebsite/SimulateFinancialCalculate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          LeadNo: body.LeadNo || 'MOCK-LEAD-001',
          DpPrcnt: Number(dpPrcnt),
          DpAmt: Math.round(Number(otrPrice) * (Number(dpPrcnt) / 100)),
          ProductCode: productCode,
          ProductName: productName,
          IsPromotion: false,
          FirstInstallment: firstInstallment,
          Tenor: body.Tenor || 36,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data && (data as { Message?: string }).Message) || 'Simulate failed');
      return NextResponse.json(data);
    } catch (e) {
      console.warn('SimulateFinancialCalculate failed:', e);
      if (shouldNotUseMockFallback()) {
        return NextResponse.json(
          { error: PRODUCTION_DATA_ERROR_MESSAGE },
          { status: 503 }
        );
      }
      await simulateDelay(400);
      const res = mockApi.calculateProductFromRule({
        otrPrice: Number(otrPrice),
        dpPrcnt: Number(dpPrcnt),
        productCode: String(productCode),
        productName: String(productName),
        firstInstallment: firstInstallment as 'ADDM' | 'ADDB',
      });
      return NextResponse.json(res);
    }
  } catch (err: unknown) {
    console.error('Simulate error:', err);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
