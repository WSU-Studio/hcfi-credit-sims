import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { pickLocaleString } from '@/lib/pick-locale';
import type { Locale } from '@/lib/pick-locale';

export async function getActivePromos(locale: Locale) {
  const now = new Date();
  const where = {
    isActive: true,
    slug: { not: null },
    OR: [{ startDate: null }, { startDate: { lte: now } }],
    AND: [
      {
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    ],
  } as unknown as Prisma.PromoWhereInput;
  const promos = await prisma.promo.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  return promos
    .filter((p): p is typeof p & { slug: string } => (p as { slug?: string | null }).slug != null)
    .map((p) => ({
      id: p.id,
      title: pickLocaleString(p.title, p.titleEn ?? undefined, locale),
      slug: p.slug,
      description: pickLocaleString(p.description ?? undefined, p.descriptionEn ?? undefined, locale),
      imageUrl: p.imageUrl,
      isHighlight: p.isHighlight ?? false,
    }));
}
