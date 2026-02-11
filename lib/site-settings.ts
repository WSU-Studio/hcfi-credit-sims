import { prisma } from './prisma';

export type SiteSettingsPublic = {
  gtmId: string;
  gaMeasurementId: string;
  whatsappFabPhone: string;
  whatsappFabMessage: string;
};

const DEFAULT: SiteSettingsPublic = {
  gtmId: '',
  gaMeasurementId: '',
  whatsappFabPhone: '',
  whatsappFabMessage: '',
};

/**
 * Baca pengaturan situs untuk tampilan publik (layout, FAB, GTM/GA).
 * Tidak memerlukan auth. Dipanggil dari server component.
 */
export async function getSiteSettings(): Promise<SiteSettingsPublic> {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: {
        key: { in: ['gtmId', 'gaMeasurementId', 'whatsappFabPhone', 'whatsappFabMessage'] },
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
