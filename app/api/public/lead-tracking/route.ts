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
import type { WebsiteLeadStage } from '@/lib/lead-tracking';

function mockLeadStage(leadNo: string): WebsiteLeadStage {
  return {
    LeadNo: leadNo,
    ApprovalCode: null,
    CustName: 'DEMO CUSTOMER',
    AssetName: 'THE ALL NEW SANTA FE',
    IdNo: '',
    LeadStepCode: 'LEAD_INPUT',
    LeadStepDescr: 'LEAD INPUT',
    LeadStatCode: 'PRP',
    LeadStatDescr: 'IN-PROGRESS',
    CreatedDt: new Date().toISOString(),
    LastUpdDt: new Date().toISOString(),
    IsFromForward: false,
    IsTakenFromDealer: false,
    ChannelCode: 'WEBSITE',
    UserInputName: null,
  };
}

/**
 * Public Lead Inquiry — Hyundai GetPagingStageWebsiteLead.
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
    return NextResponse.json({ data: [], found: false, dataSource: 'discarded' });
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
    // Mock "not found" for clearly fake suffix
    if (leadNo.endsWith('X') || leadNo.endsWith('x')) {
      return NextResponse.json({ data: [], found: false, dataSource: 'mock' });
    }
    return NextResponse.json({
      data: [mockLeadStage(leadNo)],
      found: true,
      dataSource: 'mock',
    });
  }

  try {
    const envelope = await hyundaiPost<{ Data?: WebsiteLeadStage[] }>(
      '/v1/IntegrationWebsite/GetPagingStageWebsiteLead',
      { LeadNo: leadNo }
    );

    const data = Array.isArray(envelope.Data) ? envelope.Data : [];
    return NextResponse.json({
      data,
      found: data.length > 0,
    });
  } catch (error: unknown) {
    const errorId = extractHyundaiErrorId(error);
    console.warn(
      '[lead-tracking] GetPagingStageWebsiteLead failed:',
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
      data: [mockLeadStage(leadNo)],
      found: true,
      dataSource: 'mock',
    });
  }
}
