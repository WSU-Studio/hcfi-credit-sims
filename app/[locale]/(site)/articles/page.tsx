import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { Container } from '@/app/components/ui/Container';
import { ArticleCard } from '@/app/components/ui/ArticleCard';
import type { Article } from '@/app/types';
import { pickLocaleString } from '@/lib/pick-locale';
import type { Locale } from '@/lib/pick-locale';

export const dynamic = 'force-dynamic';

async function getPublishedArticles(locale: Locale): Promise<Article[]> {
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
  });
  return articles.map((a) => ({
    title: pickLocaleString(a.title, a.titleEn ?? undefined, locale),
    image: a.imageUrl ?? '/images/main-banner.jpg',
    slug: a.slug,
  }));
}

export async function generateMetadata() {
  const t = await getTranslations('articles');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function ArticlesListPage() {
  const locale = (await getLocale()) as Locale;
  const [articles, t, tCommon] = await Promise.all([
    getPublishedArticles(locale),
    getTranslations('articles'),
    getTranslations('common'),
  ]);

  return (
    <section className="min-h-[40vh] py-8 md:py-12">
      <Container className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)] md:text-3xl">
            {t('pageTitle')}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {t('pageDescription')}
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <p className="text-[var(--muted-foreground)]">
              {tCommon('noArticles')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard
                key={article.slug ?? article.title}
                title={article.title}
                image={article.image}
                slug={article.slug}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
