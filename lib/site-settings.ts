import { prisma } from './prisma';

export type SiteSettingsPublic = {
  gtmId: string;
  gaMeasurementId: string;
  whatsappFabPhone: string;
  whatsappFabMessage: string;
  /** Teks CTA bubble di atas tombol FAB WhatsApp. */
  whatsappFabCtaText: string;
  /** 'true' = tampilkan FAB di halaman visitor, selain itu sembunyikan. */
  whatsappFabVisible: string;
  /** Nomor WhatsApp untuk tombol di hasil simulasi (leads CS/SDR). */
  whatsappLeadPhone: string;
  homeBenefitHeading1: string;
  homeBenefitHeading2: string;
  homeBenefitHeading3: string;
  homeBenefitBrand: string;
  homeProductSectionTitle: string;
  homeArticlesTitle: string;
};

export type MockApiSettings = {
  enabled: boolean;
  /** JSON object dengan kunci 'calculate' dan/atau 'simulate'. Jika tidak ada, gunakan mock bawaan. */
  content: {
    calculate?: { ListDefaultStandardProductObj?: unknown[]; ListDefaultPromotionProductObj?: unknown[] };
    simulate?: { ListProductObj?: unknown[] };
  } | null;
};

const DEFAULT: SiteSettingsPublic = {
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
};

/**
 * Baca pengaturan Mock API dari site settings (untuk API routes).
 * mockApiEnabled: 'true' = aktif, selain itu = nonaktif.
 * mockApiContent: JSON string dengan struktur { calculate?: {...}, simulate?: {...} }
 */
export async function getMockApiSettings(): Promise<MockApiSettings> {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ['mockApiEnabled', 'mockApiContent'] } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const enabled = (map.get('mockApiEnabled') ?? '').toLowerCase() === 'true';
    let content: MockApiSettings['content'] = null;
    const contentStr = (map.get('mockApiContent') ?? '').trim();
    if (contentStr) {
      try {
        const parsed = JSON.parse(contentStr) as { calculate?: unknown; simulate?: unknown };
        if (parsed && typeof parsed === 'object') {
          content = {
            calculate:
              parsed.calculate && typeof parsed.calculate === 'object'
                ? (parsed.calculate as { ListDefaultStandardProductObj?: unknown[]; ListDefaultPromotionProductObj?: unknown[] })
                : undefined,
            simulate:
              parsed.simulate && typeof parsed.simulate === 'object'
                ? (parsed.simulate as { ListProductObj?: unknown[] })
                : undefined,
          };
        }
      } catch {
        content = null;
      }
    }
    return { enabled, content };
  } catch {
    return { enabled: false, content: null };
  }
}

/**
 * Baca pengaturan situs untuk tampilan publik (layout, FAB, GTM/GA).
 * Tidak memerlukan auth. Dipanggil dari server component.
 */
export async function getSiteSettings(): Promise<SiteSettingsPublic> {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            'gtmId',
            'gaMeasurementId',
            'whatsappFabPhone',
            'whatsappFabMessage',
            'whatsappFabCtaText',
            'whatsappFabVisible',
            'whatsappLeadPhone',
            'homeBenefitHeading1',
            'homeBenefitHeading2',
            'homeBenefitHeading3',
            'homeBenefitBrand',
            'homeProductSectionTitle',
            'homeArticlesTitle',
          ],
        },
      },
    });
    const data = { ...DEFAULT };
    rows.forEach((r) => {
      if (r.key in data) (data as Record<string, string>)[r.key] = r.value;
    });
    return data;
  } catch {
    return DEFAULT;
  }
}
