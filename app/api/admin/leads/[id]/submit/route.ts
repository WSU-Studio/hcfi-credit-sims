import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions';
import {
  fetchVendorsForAssignment,
  submitLeadToHyundai,
} from '@/lib/hyundai-lead-integration';
import { parseLeadAssetSnapshot } from '@/lib/lead-asset-snapshot';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission('LEADS', 'edit');
    const body = await request.json();
    const { vendorCode, cmoEmpNo, cmoName } = body as {
      vendorCode?: string;
      cmoEmpNo?: string;
      cmoName?: string;
    };

    if (!vendorCode || !cmoEmpNo) {
      return NextResponse.json(
        { error: 'vendorCode and cmoEmpNo are required' },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.hyundaiAssignStatus === 'SUBMITTED' && lead.hyundaiLeadNo) {
      return NextResponse.json(
        { error: 'Lead sudah dikirim ke Hyundai', hyundaiLeadNo: lead.hyundaiLeadNo },
        { status: 409 }
      );
    }

    const vendors = await fetchVendorsForAssignment();
    const vendor = vendors.find((v) => v.VendorCode === vendorCode);
    if (!vendor) {
      return NextResponse.json({ error: 'Dealer tidak ditemukan' }, { status: 400 });
    }

    const { leadNo } = await submitLeadToHyundai({
      lead: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        productName: lead.productName,
        vehicleSummary: lead.vehicleSummary,
        assetSnapshot: parseLeadAssetSnapshot(lead.assetSnapshot),
        vendorCode: lead.vendorCode,
        otrPrice: lead.otrPrice,
        dpPercent: lead.dpPercent,
        tenor: lead.tenor,
        motherName: lead.motherName,
        homeOwnershipStatus: lead.homeOwnershipStatus,
        citizenType: lead.citizenType,
        notes: lead.notes,
        ktpUrl: lead.ktpUrl,
      },
      vendor,
      cmoEmpNo,
      cmoName: cmoName || cmoEmpNo,
    });

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        vendorCode: vendor.VendorCode,
        vendorName: vendor.VendorName,
        oriOfficeCode: vendor.OriOfficeCode,
        oriOfficeName: vendor.OriOfficeName,
        cmoEmpNo,
        cmoName: cmoName || null,
        hyundaiLeadNo: leadNo,
        hyundaiAssignStatus: 'SUBMITTED',
        hyundaiAssignError: null,
        hyundaiAssignedAt: new Date(),
        status: 'CONTACTED',
      },
    });

    return NextResponse.json({ success: true, lead: updated, hyundaiLeadNo: leadNo });
  } catch (error: unknown) {
    console.error('[admin/leads/submit]', error);
    const message = error instanceof Error ? error.message : 'Submit failed';

    try {
      await prisma.lead.update({
        where: { id },
        data: {
          hyundaiAssignStatus: 'FAILED',
          hyundaiAssignError: message,
        },
      });
    } catch {
      // ignore secondary failure
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
