import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { isDealerPortalUser } from '@/lib/dealer-portal';
import {
  calculatePromotionDiscount,
  isPromotionCurrentlyValid,
} from '@/lib/dealer-promotion';
import { requireDealerVendorScope } from '@/lib/dealer-promotion-access';
import { prisma } from '@/lib/prisma';

/**
 * Lookup active promotion for a model — used by quotation PriceStep (Phase 3).
 * Salesman & dealer admin can read promotions for their vendor.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isDealerPortalUser(session.user.userType)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const vendorCode = session.user.vendorCode?.trim();
    if (!vendorCode) {
      return NextResponse.json(
        { error: 'Akun belum memiliki penugasan dealer' },
        { status: 400 }
      );
    }

    const assetCode = request.nextUrl.searchParams.get('assetCode')?.trim();
    if (!assetCode) {
      return NextResponse.json(
        { error: 'assetCode wajib diisi' },
        { status: 400 }
      );
    }

    const otrPriceParam = request.nextUrl.searchParams.get('otrPrice');
    const otrPrice =
      otrPriceParam != null && otrPriceParam !== ''
        ? Number(otrPriceParam)
        : null;

    const promo = await prisma.dealerPromotion.findUnique({
      where: {
        vendorCode_assetCode: { vendorCode, assetCode },
      },
    });

    if (!promo || !isPromotionCurrentlyValid(promo)) {
      return NextResponse.json({ promotion: null, discountAmount: 0 });
    }

    const discountAmount =
      otrPrice != null && Number.isFinite(otrPrice) && otrPrice > 0
        ? calculatePromotionDiscount(otrPrice, promo)
        : null;

    return NextResponse.json({
      promotion: promo,
      discountAmount: discountAmount ?? 0,
    });
  } catch (error) {
    console.error('Error looking up dealer promotion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
