import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { Container } from '@/app/components/ui/Container';
import { ProductCard } from '@/app/components/ui/ProductCard';
import type { Product } from '@/app/types';
import { pickLocaleString } from '@/lib/pick-locale';
import type { Locale } from '@/lib/pick-locale';

export const dynamic = 'force-dynamic';

async function getAllProducts(locale: Locale): Promise<Product[]> {
  const products = await prisma.product.findMany({
    orderBy: { order: 'asc' },
  });
  return products.map((p) => ({
    id: p.id,
    title: pickLocaleString(p.title, p.titleEn ?? undefined, locale),
    subtitle: pickLocaleString(p.subtitle ?? undefined, p.subtitleEn ?? undefined, locale) || undefined,
    image: p.imageUrl,
  }));
}

export async function generateMetadata() {
  const t = await getTranslations('products');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function ProductsListPage() {
  const locale = (await getLocale()) as Locale;
  const [products, t, tCommon] = await Promise.all([
    getAllProducts(locale),
    getTranslations('products'),
    getTranslations('common'),
  ]);

  return (
    <section className="min-h-[40vh] py-8 md:py-12">
      <Container className="space-y-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)] md:text-3xl">
            {t('pageTitle')}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {t('pageDescription')}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <p className="text-[var(--muted-foreground)]">
              {tCommon('noProducts')}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id ?? product.title} {...product} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
