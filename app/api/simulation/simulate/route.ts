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
      return NextResponse.json({ ...res, dataSource: 'mock' });
    }

    try {
      const headers = await getHyundaiRequestHeaders();
      if (!headers['AdInsKey']) {
        return NextResponse.json(
          { error: PRODUCTION_DATA_ERROR_MESSAGE },
          { status: 503 }
        );
      }
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
      const resText = await res.text();
      let data: { Message?: string } = {};
      try {
        data = resText ? JSON.parse(resText) : {};
      } catch {
        if (!res.ok || shouldNotUseMockFallback()) {
          if (res.status === 401) clearHyundaiTokenCache();
          return NextResponse.json(
            { error: PRODUCTION_DATA_ERROR_MESSAGE },
            { status: 503 }
          );
        }
        throw new Error('Response bukan JSON');
      }
      if (!res.ok) {
        if (res.status === 401) clearHyundaiTokenCache();
        if (shouldNotUseMockFallback()) {
          return NextResponse.json(
            { error: PRODUCTION_DATA_ERROR_MESSAGE },
            { status: 503 }
          );
        }
        throw new Error(data.Message || 'Simulate failed');
      }
      return NextResponse.json({ ...data, dataSource: 'hyundai' });
    } catch (e) {
      console.warn('SimulateFinancialCalculate failed, using mock:', e);
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
      return NextResponse.json({ ...res, dataSource: 'mock' });
    }
  } catch (err: unknown) {
    console.error('Simulate error:', err);
    if (shouldNotUseMockFallback()) {
      return NextResponse.json(
        { error: PRODUCTION_DATA_ERROR_MESSAGE },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
