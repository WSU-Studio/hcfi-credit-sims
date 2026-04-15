import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/site-settings';

/**
 * GET /api/public/site-settings
 * Pengaturan situs untuk tampilan publik (tanpa auth).
 * Dipakai oleh client untuk tombol WhatsApp di hasil simulasi, dll.
 */
export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      {
        gtmId: '',
        gaMeasurementId: '',
        whatsappFabPhone: '',
        whatsappFabMessage: '',
        whatsappFabCtaText: '',
        whatsappFabVisible: 'true',
        whatsappLeadPhone: '',
        homeBenefitHeading1: '',
        homeBenefitHeading2: '',
        homeBenefitHeading3: '',
        homeBenefitBrand: '',
        homeProductSectionTitle: '',
        homeArticlesTitle: '',
      },
      { status: 200 }
    );
  }
}
