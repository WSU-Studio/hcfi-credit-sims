import { NextRequest, NextResponse } from 'next/server';
import {
  isMockApiActive,
  shouldNotUseMockFallback,
  simulateDelay,
} from '@/lib/mock-api';
import { getMockApiSettings } from '@/lib/site-settings';
import { hyundaiPost } from '@/lib/hyundai-api-post';
import {
  extractHyundaiErrorId,
  toUserFacingHyundaiError,
  DEFAULT_USER_FACING_SERVICE_ERROR,
} from '@/lib/hyundai-known-errors';
import { getClientIp, leadTrackingLimiter, tooManyRequestsResponse } from '@/lib/ratelimit';
import { leadTrackingSchema } from '@/lib/security/schemas';
import { isHoneypotTripped, HONEYPOT_FIELD } from '@/lib/security/honeypot';
import {
  normalizeTaskHistory,
  sortTaskHistory,
  type LeadMonitoringResult,
  type LeadTaskHistoryItem,
} from '@/lib/lead-tracking';
import { prisma } from '@/lib/prisma';

type MonitoringEnvelope = {
  CustConsentStatus?: string | null;
  ListTaskHistory?: unknown;
  StatusCode?: string;
  Message?: string;
  HeaderObj?: { StatusCode?: string; Message?: string };
};

function mockTaskHistory(leadNo: string): LeadTaskHistoryItem[] {
  const now = Date.now();
  return [
    {
      Name: 'Lead Created (Website)',
      IndicatorSLA: null,
      StartTime: new Date(now - 3 * 60_000).toISOString(),
      EndTime: new Date(now - 3 * 60_000 + 800).toISOString(),
      Assignee: null,
      Due: null,
      TrxNo: leadNo,
    },
    {
      Name: 'Customer Consent Submitted',
      IndicatorSLA: null,
      StartTime: new Date(now - 2 * 60_000).toISOString(),
      EndTime: new Date(now - 2 * 60_000 + 500).toISOString(),
      Assignee: null,
      Due: null,
      TrxNo: null,
    },
    {
      Name: 'Update App Status and Step To Live',
      IndicatorSLA: null,
      StartTime: new Date(now - 60_000).toISOString(),
      EndTime: new Date(now - 59_000).toISOString(),
      Assignee: null,
      Due: null,
      TrxNo: null,
    },
  ];
}

function mockMonitoring(leadNo: string): LeadMonitoringResult {
  return {
    LeadNo: leadNo,
    CustConsentStatus: 'SCS',
    ListTaskHistory: mockTaskHistory(leadNo),
    CustName: 'DEMO CUSTOMER',
    VehicleSummary: 'THE ALL NEW SANTA FE',
  };
}

/**
 * Endpoint monitoring tidak mengembalikan nama/aset.
 * Enrich dari Lead lokal jika LeadNo cocok.
 */
async function enrichFromLocalLead(
  leadNo: string,
  result: LeadMonitoringResult
): Promise<LeadMonitoringResult> {
  const local = await prisma.lead.findFirst({
    where: {
      OR: [{ simulationLeadNo: leadNo }, { hyundaiLeadNo: leadNo }],
    },
    select: { name: true, vehicleSummary: true },
    orderBy: { createdAt: 'desc' },
  });
  if (!local) return result;
  return {
    ...result,
    CustName: local.name?.trim() || result.CustName || null,
    VehicleSummary: local.vehicleSummary?.trim() || result.VehicleSummary || null,
  };
}

function buildMonitoringResult(
  leadNo: string,
  envelope: MonitoringEnvelope
): LeadMonitoringResult {
  return {
    LeadNo: leadNo,
    CustConsentStatus: String(envelope.CustConsentStatus ?? '').trim(),
    ListTaskHistory: sortTaskHistory(normalizeTaskHistory(envelope.ListTaskHistory)),
  };
}

function isMonitoringFound(result: LeadMonitoringResult): boolean {
  return (
    result.ListTaskHistory.length > 0 || result.CustConsentStatus.length > 0
  );
}

/**
 * Public Lead Inquiry — Hyundai GetMonitoringByStgLeadNo (Postman v1.9).
 * Body: { leadNo }
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = leadTrackingLimiter.limit(ip);
  if (!rl.success) {
    return tooManyRequestsResponse(
      'Terlalu banyak permintaan. Silakan coba lagi sebentar.',
      rl.retryAfterSec
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (
    rawBody &&
    typeof rawBody === 'object' &&
    isHoneypotTripped((rawBody as Record<string, unknown>)[HONEYPOT_FIELD])
  ) {
    return NextResponse.json({ data: null, found: false, dataSource: 'discarded' });
  }

  const parsed = leadTrackingSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: 'Invalid input',
        field: firstIssue?.path?.join('.') ?? 'leadNo',
        message: firstIssue?.message ?? 'Validation failed',
      },
      { status: 400 }
    );
  }

  const leadNo = parsed.data.leadNo;
  const siteMock = await getMockApiSettings();

  if (isMockApiActive(siteMock.enabled) || leadNo.startsWith('MOCK-LEAD-')) {
    await simulateDelay(400);
    if (leadNo.endsWith('X') || leadNo.endsWith('x')) {
      return NextResponse.json({ data: null, found: false, dataSource: 'mock' });
    }
    return NextResponse.json({
      data: mockMonitoring(leadNo),
      found: true,
      dataSource: 'mock',
    });
  }

  try {
    const envelope = await hyundaiPost<MonitoringEnvelope>(
      '/v1/IntegrationWebsite/GetMonitoringByStgLeadNo',
      { LeadNo: leadNo }
    );

    const base = buildMonitoringResult(leadNo, envelope);
    if (!isMonitoringFound(base)) {
      return NextResponse.json({ data: null, found: false });
    }

    const enriched = await enrichFromLocalLead(leadNo, base);
    return NextResponse.json({
      data: enriched,
      found: true,
    });
  } catch (error: unknown) {
    const errorId = extractHyundaiErrorId(error);
    console.warn(
      '[lead-tracking] GetMonitoringByStgLeadNo failed:',
      errorId ? `(Hyundai Error ID: ${errorId})` : '',
      error instanceof Error ? error.message : error
    );

    if (shouldNotUseMockFallback()) {
      return NextResponse.json(
        {
          error: toUserFacingHyundaiError(error, DEFAULT_USER_FACING_SERVICE_ERROR),
          errorId,
        },
        { status: 502 }
      );
    }

    await simulateDelay(300);
    return NextResponse.json({
      data: mockMonitoring(leadNo),
      found: true,
      dataSource: 'mock',
    });
  }
}
