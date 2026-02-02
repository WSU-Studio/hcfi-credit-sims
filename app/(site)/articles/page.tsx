import { prisma } from '@/lib/prisma';
import { Container } from '@/app/components/ui/Container';
import { ArticleCard } from '@/app/components/ui/ArticleCard';
import type { Article } from '@/app/types';

export const dynamic = 'force-dynamic';

async function getPublishedArticles(): Promise<Article[]> {
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      title: true,
      slug: true,
      imageUrl: true,
    },
  });
  return articles.map((a) => ({
    title: a.title,
    image: a.imageUrl ?? '/images/main-banner.jpg',
    slug: a.slug,
  }));
}

export async function generateMetadata() {
  return {
    title: 'Hyundai Capital - Artikel',
    description: 'Artikel dan informasi terbaru dari Hyundai Capital.',
  };
}

export default async function ArticlesListPage() {
  const articles = await getPublishedArticles();

  return (
    <section className="min-h-[40vh] py-8 md:py-12">
      <Container className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)] md:text-3xl">
            Artikel
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Artikel dan informasi terbaru dari Hyundai Capital
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <p className="text-[var(--muted-foreground)]">
              Belum ada artikel saat ini.
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
