import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { Container } from '@/app/components/ui/Container';
import { SanitizedHtml } from '@/app/components/ui/SanitizedHtml';

export const dynamic = 'force-dynamic';

async function getArticleBySlug(slug: string) {
  try {
    return await prisma.article.findFirst({
      where: {
        slug,
        isPublished: true,
      },
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Hyundai Capital' };
  return {
    title: `Hyundai Capital - ${article.title}`,
    description: article.metaDescription ?? article.excerpt ?? undefined,
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const imageUrl = article.imageUrl?.trim() || null;
  const publishedLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;
  const readingLabel =
    article.readingTime != null ? `${article.readingTime} menit baca` : null;

  const bottomNav = (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-300/50">
      <Link
        href="/articles"
        className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100/80 rounded-lg hover:bg-slate-200 transition-colors duration-300 border border-slate-500"
      >
        <span className="text-sm font-semibold text-slate-700">
          Kembali ke Daftar Artikel
        </span>
      </Link>
    </div>
  );

  return (
    <section className="min-h-[40vh] py-8 md:py-12">
      <Container>
        <article className="max-w-3xl mx-auto">
          <header className="space-y-4">
            <h1 className="text-2xl font-bold text-[var(--foreground)] md:text-3xl leading-tight">
              {article.title}
            </h1>
            {(article.subtitle ?? publishedLabel ?? readingLabel) && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
                {article.subtitle && (
                  <span className="font-medium">{article.subtitle}</span>
                )}
                {publishedLabel && (
                  <span className="tabular-nums">{publishedLabel}</span>
                )}
                {readingLabel && (
                  <span className="tabular-nums">{readingLabel}</span>
                )}
              </div>
            )}
            {imageUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
                <Image
                  src={imageUrl}
                  alt={article.title}
                  width={800}
                  height={450}
                  className="object-cover"
                  unoptimized
                  priority
                />
              </div>
            )}
            {article.excerpt && (
              <p className="text-lg text-[var(--muted-foreground)] leading-relaxed">
                {article.excerpt}
              </p>
            )}
          </header>

          <div className="mt-6 prose prose-slate prose-sm max-w-none dark:prose-invert">
            <SanitizedHtml html={article.content} />
          </div>

          {bottomNav}
        </article>
      </Container>
    </section>
  );
}
