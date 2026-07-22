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
  resolveTrackingLeadNo,
  sortTaskHistory,
  type LeadMonitoringResult,
  type LeadTaskHistoryItem,
  type LocalLeadTrackingRef,
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
      Name: 'Input data from website',
      IndicatorSLA: null,
      StartTime: new Date(now - 5 * 60_000).toISOString(),
      EndTime: new Date(now - 5 * 60_000 + 800).toISOString(),
      Assignee: null,
      Due: null,
      TrxNo: leadNo,
    },
    {
      Name: 'Update Customer Consent Status Success',
      IndicatorSLA: null,
      StartTime: new Date(now - 4 * 60_000).toISOString(),
      EndTime: new Date(now - 4 * 60_000 + 500).toISOString(),
      Assignee: null,
      Due: null,
      TrxNo: null,
    },
    {
      Name: 'Request CBAS_SLIK',
      IndicatorSLA: null,
      StartTime: new Date(now - 3 * 60_000).toISOString(),
      EndTime: new Date(now - 3 * 60_000 + 900).toISOString(),
      Assignee: null,
      Due: null,
      TrxNo: null,
    },
    {
      Name: 'Lead Review',
      IndicatorSLA: null,
      StartTime: new Date(now - 2 * 60_000).toISOString(),
      EndTime: null,
      Assignee: null,
      Due: null,
      TrxNo: null,
    },
  ];
}

function mockMonitoring(
  leadNo: string,
  opts?: { simulationLeadNo?: string | null; custName?: string | null; vehicleSummary?: string | null }
): LeadMonitoringResult {
  return {
    LeadNo: leadNo,
    CustConsentStatus: 'SCS',
    ListTaskHistory: mockTaskHistory(leadNo),
    CustName: opts?.custName ?? 'DEMO CUSTOMER',
    VehicleSummary: opts?.vehicleSummary ?? 'THE ALL NEW SANTA FE',
    SimulationLeadNo: opts?.simulationLeadNo ?? null,
  };
}

async function findLocalLead(leadNo: string): Promise<LocalLeadTrackingRef | null> {
  const normalized = leadNo.trim().toUpperCase();

  const direct = await prisma.lead.findFirst({
    where: {
      OR: [
        { simulationLeadNo: { equals: normalized, mode: 'insensitive' } },
        { hyundaiLeadNo: { equals: normalized, mode: 'insensitive' } },
      ],
    },
    select: {
      simulationLeadNo: true,
      hyundaiLeadNo: true,
      hyundaiAssignStatus: true,
      name: true,
      vehicleSummary: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  if (direct) return direct;

  // Fallback: LeadNo simulasi tersimpan di LeadAssetDraft, link via convertedLeadId.
  const draft = await prisma.leadAssetDraft.findFirst({
    where: { hyundaiLeadNo: { equals: normalized, mode: 'insensitive' } },
    select: { convertedLeadId: true },
    orderBy: { createdAt: 'desc' },
  });
  if (!draft?.convertedLeadId) return null;

  const fromDraft = await prisma.lead.findUnique({
    where: { id: draft.convertedLeadId },
    select: {
      simulationLeadNo: true,
      hyundaiLeadNo: true,
      hyundaiAssignStatus: true,
      name: true,
      vehicleSummary: true,
    },
  });
  if (!fromDraft) return null;

  return {
    ...fromDraft,
    // Draft.hyundaiLeadNo = LeadNo simulasi PriceStep; isi jika Lead belum menyimpan field-nya.
    simulationLeadNo: fromDraft.simulationLeadNo?.trim() || normalized,
  };
}

function enrichWithLocal(
  result: LeadMonitoringResult,
  local: LocalLeadTrackingRef | null,
  simulationLeadNo: string | null
): LeadMonitoringResult {
  return {
    ...result,
    CustName: local?.name?.trim() || result.CustName || null,
    VehicleSummary: local?.vehicleSummary?.trim() || result.VehicleSummary || null,
    SimulationLeadNo: simulationLeadNo || result.SimulationLeadNo || null,
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
 *
 * LeadNo simulasi (PriceStep) sering berbeda dari LeadNo submitted (admin → MLoan).
 * Resolve dulu via DB lokal: simulationLeadNo → hyundaiLeadNo, baru hit monitoring.
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

  const inputLeadNo = parsed.data.leadNo.trim().toUpperCase();
  const local = await findLocalLead(inputLeadNo);
  const resolved = resolveTrackingLeadNo(inputLeadNo, local);

  if (resolved.pendingSubmit) {
    return NextResponse.json({
      data: null,
      found: false,
      reason: 'pending_submit',
      queriedLeadNo: inputLeadNo,
      simulationLeadNo: resolved.simulationLeadNo,
    });
  }

  const monitorLeadNo = resolved.monitorLeadNo;
  const siteMock = await getMockApiSettings();

  if (isMockApiActive(siteMock.enabled) || inputLeadNo.startsWith('MOCK-LEAD-')) {
    await simulateDelay(400);
    if (inputLeadNo.endsWith('X') || inputLeadNo.endsWith('x')) {
      return NextResponse.json({ data: null, found: false, dataSource: 'mock' });
    }
    return NextResponse.json({
      data: mockMonitoring(monitorLeadNo, {
        simulationLeadNo: resolved.simulationLeadNo,
        custName: local?.name,
        vehicleSummary: local?.vehicleSummary,
      }),
      found: true,
      dataSource: 'mock',
      resolvedFromSimulation: resolved.resolvedFromSimulation,
      queriedLeadNo: inputLeadNo,
    });
  }

  try {
    const envelope = await hyundaiPost<MonitoringEnvelope>(
      '/v1/IntegrationWebsite/GetMonitoringByStgLeadNo',
      { LeadNo: monitorLeadNo }
    );

    const base = buildMonitoringResult(monitorLeadNo, envelope);
    if (!isMonitoringFound(base)) {
      return NextResponse.json({
        data: null,
        found: false,
        queriedLeadNo: inputLeadNo,
        monitorLeadNo,
      });
    }

    const enriched = enrichWithLocal(base, local, resolved.simulationLeadNo);
    return NextResponse.json({
      data: enriched,
      found: true,
      resolvedFromSimulation: resolved.resolvedFromSimulation,
      queriedLeadNo: inputLeadNo,
    });
  } catch (error: unknown) {
    const errorId = extractHyundaiErrorId(error);
    console.warn(
      '[lead-tracking] GetMonitoringByStgLeadNo failed:',
      errorId ? `(Hyundai Error ID: ${errorId})` : '',
      error instanceof Error ? error.message : error,
      { inputLeadNo, monitorLeadNo, resolvedFromSimulation: resolved.resolvedFromSimulation }
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
      data: mockMonitoring(monitorLeadNo, {
        simulationLeadNo: resolved.simulationLeadNo,
        custName: local?.name,
        vehicleSummary: local?.vehicleSummary,
      }),
      found: true,
      dataSource: 'mock',
      resolvedFromSimulation: resolved.resolvedFromSimulation,
      queriedLeadNo: inputLeadNo,
    });
  }
}
