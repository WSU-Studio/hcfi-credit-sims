import { notFound } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { prisma } from '@/lib/prisma';
import { Container } from '@/app/components/ui/Container';
import { WidgetRenderer } from '@/app/components/page-builder/WidgetRenderer';
import type { PageLayout, LayoutRow } from '@/app/types';

export const dynamic = 'force-dynamic';

const RESERVED_SLUGS = ['simulasi-kredit', 'admin', 'auth', 'api'];

async function getPageBySlug(slug: string) {
  if (RESERVED_SLUGS.includes(slug)) return null;
  try {
    return await prisma.staticPage.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

async function getAllSlugs() {
  try {
    const pages = await prisma.staticPage.findMany({
      select: { slug: true },
      orderBy: { title: 'asc' },
    });
    return pages.map((p) => p.slug);
  } catch {
    return [];
  }
}

export default async function StaticPageBySlug({
  params,
}: {
  params: Promise<{ pageSlug: string }> | { pageSlug: string };
}) {
  const { pageSlug } = await Promise.resolve(params);
  const page = await getPageBySlug(pageSlug);
  if (!page) notFound();

  const layout = page.layout as PageLayout | null;
  const hasLayout =
    layout &&
    typeof layout === 'object' &&
    Array.isArray(layout?.rows) &&
    layout.rows.length > 0;
  const slugs = await getAllSlugs();
  const currentIndex = slugs.indexOf(pageSlug);
  const nextSlug =
    currentIndex >= 0 && currentIndex < slugs.length - 1
      ? slugs[currentIndex + 1]
      : null;

  function RowGrid({ row }: { row: LayoutRow }) {
    return (
      <div
        className={`grid gap-6 ${
          row.gridCols === 1
            ? 'grid-cols-1'
            : row.gridCols === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-3'
        }`}
      >
        {row.cells.map((cell) => (
          <div key={cell.id} className="min-w-0">
            <WidgetRenderer cell={cell} />
          </div>
        ))}
      </div>
    );
  }

  const bottomNav = (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-600/50">
      <Link
        href="/"
        className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors"
      >
        Kembali ke Beranda
      </Link>
      {nextSlug && (
        <Link
          href={`/${nextSlug}`}
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-[#1956FF] rounded-lg hover:bg-[#1956FF]/90 transition-colors"
        >
          Berikutnya
        </Link>
      )}
    </div>
  );

  return (
    <section className="min-h-[60vh]">
      <Container>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--foreground)] md:text-3xl">
            {page.title}
          </h1>
        </div>
      </Container>

      {hasLayout ? (
        <div className="space-y-8">
          {layout.rows.map((row) =>
            row.useContainer !== false ? (
              <Container key={row.id} className="py-0">
                <RowGrid row={row} />
              </Container>
            ) : (
              <div key={row.id} className="w-full">
                <RowGrid row={row} />
              </div>
            )
          )}
          <Container>{bottomNav}</Container>
        </div>
      ) : (
        <Container>
          {page.content ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(page.content, {
                  ALLOWED_TAGS: [
                    'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'span',
                  ],
                  ALLOWED_ATTR: ['href', 'target', 'rel'],
                }),
              }}
            />
          ) : (
            <p className="text-white/70">Belum ada konten.</p>
          )}
          {bottomNav}
        </Container>
      )}
    </section>
  );
}
