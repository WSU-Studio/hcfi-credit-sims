import { NextRequest, NextResponse } from 'next/server';
import {
  isMockModeEnabled,
  simulateDelay,
  shouldNotUseMockFallback,
  PRODUCTION_DATA_ERROR_MESSAGE,
} from '@/lib/mock-api';
import { getMockApiSettings } from '@/lib/site-settings';
import {
  extractHyundaiErrorId,
  toUserFacingHyundaiError,
} from '@/lib/hyundai-known-errors';
import { resolveIsPartner } from '@/lib/hyundai-partner';
import { finalizeSimulationSummary } from '@/lib/hyundai-lead-financial';
import type { FinalSummaryInfo } from '@/app/types/credit-simulation';

function isMockLeadNo(leadNo?: string | null): boolean {
  if (!leadNo) return false;
  return leadNo.startsWith('MOCK-LEAD-') || leadNo.startsWith('FAILED-');
}

function buildMockFinalSummary(params: {
  otrPrice: number;
  dpPercent: number;
  tenor: number;
  productName: string;
  productCode: string;
  firstInstallment: 'ADDM' | 'ADDB';
}): FinalSummaryInfo {
  const dpAmt = Math.round(params.otrPrice * (params.dpPercent / 100));
  const ntfAmt = params.otrPrice - dpAmt;
  const instAmt = Math.round(ntfAmt / Math.max(params.tenor, 1) / 1000) * 1000;
  const totalDownPaymentAmt =
    params.firstInstallment === 'ADDM' ? dpAmt + instAmt + 3_000_000 : dpAmt + 3_000_000;
  const totalPaymentAmt =
    params.firstInstallment === 'ADDM'
      ? totalDownPaymentAmt + instAmt * (params.tenor - 1)
      : totalDownPaymentAmt + instAmt * params.tenor;

  return {
    productName: params.productName,
    productCode: params.productCode,
    assetDownPaymentPrcnt: params.dpPercent,
    tenor: params.tenor,
    flatRatePrcnt: 6.89,
    instAmt,
    totalDownPaymentAmt,
    totalPaymentAmt,
    assetPriceAmt: params.otrPrice,
    ntfAmt,
    downPaymentAmt: dpAmt,
    firstInstallment: params.firstInstallment,
  };
}

/**
 * Finalize pilihan simulasi user ke Hyundai Confins lalu kembalikan SummaryInfoObj
 * ter-map (Cust Consent fields) untuk View Summary / PDF.
 *
 * Chain: CalculateProductFromRule → SimulateFinancialCalculate → SaveFinancialData
 * → FinalCalculateByLeadNo → SaveFinalCalculateResult
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const leadNo: string | undefined = body.leadNo || body.LeadNo;
    const otrPrice = Number(body.otrPrice);
    const dpPercent = Number(body.dpPercent ?? body.dpPrcnt);
    const tenor = Number(body.tenor);
    const productCode = String(body.productCode ?? '').trim();
    const productName = String(body.productName ?? '').trim();
    const firstInstallment: 'ADDM' | 'ADDB' =
      body.firstInstallment === 'ADDB' ? 'ADDB' : 'ADDM';
    const isPromotion = Boolean(body.isPromotion);
    const partnerCode =
      typeof body.partnerCode === 'string' ? body.partnerCode : null;

    if (!leadNo?.trim()) {
      return NextResponse.json(
        { error: 'LeadNo wajib untuk final summary.' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(otrPrice) || otrPrice <= 0) {
      return NextResponse.json({ error: 'otrPrice wajib diisi.' }, { status: 400 });
    }
    if (!Number.isFinite(dpPercent) || dpPercent < 0 || dpPercent > 100) {
      return NextResponse.json({ error: 'dpPercent tidak valid.' }, { status: 400 });
    }
    if (!Number.isFinite(tenor) || tenor < 1) {
      return NextResponse.json({ error: 'tenor wajib diisi.' }, { status: 400 });
    }
    if (!productCode || !productName) {
      return NextResponse.json(
        { error: 'productCode dan productName wajib diisi.' },
        { status: 400 }
      );
    }

    const siteMock = await getMockApiSettings();
    const mockEnabled = siteMock.enabled || isMockModeEnabled();

    if (mockEnabled || isMockLeadNo(leadNo)) {
      await simulateDelay(600);
      return NextResponse.json({
        summary: buildMockFinalSummary({
          otrPrice,
          dpPercent,
          tenor,
          productName,
          productCode,
          firstInstallment,
        }),
        dataSource: 'mock',
      });
    }

    try {
      const summary = await finalizeSimulationSummary({
        leadNo: leadNo.trim(),
        otrPrice,
        dpPercent,
        tenor,
        productCode,
        productName,
        firstInstallment,
        isPromotion,
        isPartner: resolveIsPartner({ partnerCode }),
      });

      return NextResponse.json({ summary });
    } catch (e) {
      const errorId = extractHyundaiErrorId(e);
      const rawMessage = e instanceof Error ? e.message : 'Final summary failed';
      console.warn(
        '[final-summary]',
        errorId ? `(Error ID: ${errorId})` : '',
        rawMessage
      );

      if (shouldNotUseMockFallback()) {
        return NextResponse.json(
          {
            error: toUserFacingHyundaiError(e, PRODUCTION_DATA_ERROR_MESSAGE),
            errorId,
          },
          { status: 502 }
        );
      }

      await simulateDelay(400);
      return NextResponse.json({
        summary: buildMockFinalSummary({
          otrPrice,
          dpPercent,
          tenor,
          productName,
          productCode,
          firstInstallment,
        }),
        dataSource: 'mock',
      });
    }
  } catch (err: unknown) {
    console.error('[final-summary] handler error:', err);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
