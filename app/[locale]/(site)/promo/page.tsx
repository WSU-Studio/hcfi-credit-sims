import type { Prisma } from '@prisma/client';
import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { Container } from '@/app/components/ui/Container';
import { PromoCard } from '@/app/components/ui/PromoCard';
import { pickLocaleString } from '@/lib/pick-locale';
import type { Locale } from '@/lib/pick-locale';

export const dynamic = 'force-dynamic';

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

export async function generateMetadata() {
  const t = await getTranslations('promo');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function PromoListPage() {
  const locale = (await getLocale()) as Locale;
  const [promos, t, tCommon] = await Promise.all([
    getActivePromos(locale),
    getTranslations('promo'),
    getTranslations('common'),
  ]);

  return (
    <section className="min-h-[40vh] py-8 md:py-12">
      <Container>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
            {t('pageTitle')}
          </h1>
          <p className="mt-1 text-slate-600">
            {t('pageDescription')}
          </p>
        </div>

        {promos.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <p className="text-[var(--muted-foreground)]">
              {tCommon('noPromos')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promos.map((promo) => (
              <PromoCard
                key={promo.id}
                title={promo.title}
                description={promo.description}
                imageUrl={promo.imageUrl}
                slug={promo.slug}
                isHighlight={promo.isHighlight ?? false}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
