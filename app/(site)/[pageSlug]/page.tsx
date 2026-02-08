import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Container } from '@/app/components/ui/Container';
import { SanitizedHtml } from '@/app/components/ui/SanitizedHtml';
import { WidgetRenderer } from '@/app/components/page-builder/WidgetRenderer';
import type { PageLayout, LayoutRow } from '@/app/types';

export const dynamic = 'force-dynamic';

const RESERVED_SLUGS = ['credit-simulation', 'admin', 'auth', 'api'];

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

// async function getAllSlugs() {
//   try {
//     const pages = await prisma.staticPage.findMany({
//       select: { slug: true },
//       orderBy: { title: 'asc' },
//     });
//     return pages.map((p) => p.slug);
//   } catch {
//     return [];
//   }
// }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageSlug: string }> | { pageSlug: string };
}) {
  const { pageSlug } = await Promise.resolve(params);
  const page = await getPageBySlug(pageSlug);
  if (!page) return { title: 'Hyundai Capital' };
  return {
    title: `Hyundai Capital - ${page.title}`,
  };
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
  const showBasicContent = (page as { showBasicContent?: boolean }).showBasicContent ?? true;
  // const slugs = await getAllSlugs();
  // const currentIndex = slugs.indexOf(pageSlug);
  // const nextSlug =
  //   currentIndex >= 0 && currentIndex < slugs.length - 1
  //     ? slugs[currentIndex + 1]
  //     : null;
  // const previousSlug =
  //   currentIndex >= 0 && currentIndex > 0
  //     ? slugs[currentIndex - 1]
  //     : null;

  function RowGrid({ row }: { row: LayoutRow }) {
    const fullWidth = row.useContainer === false;
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
            <WidgetRenderer cell={cell} fullWidth={fullWidth} />
          </div>
        ))}
      </div>
    );
  }

  const bottomNav = (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-300/50">
      <Link
        href="/"
        className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100/80 rounded-lg hover:bg-slate-200 transition-colors duration-300 border border-slate-500"
      >
        <span className="text-sm font-semibold text-slate-700">
          Kembali ke Beranda
        </span>
      </Link>
      {/* <div className="flex flex-wrap items-center gap-3">
        {nextSlug && (
          <Link
            href={`/${nextSlug}`}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100/80 rounded-lg hover:bg-slate-200 transition-colors duration-300 border border-slate-500"
          >
            Berikutnya
          </Link>
        )}
        {previousSlug && (
          <Link
            href={`/${previousSlug}`}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-[#1956FF] rounded-lg hover:bg-[#1956FF]/90 transition-colors"
          >
            Sebelumnya
          </Link>
        )}
      </div> */}
    </div>
  );

  const basicContentBlock = showBasicContent && (
    <div className="py-8">
      <h1 className="text-2xl font-semibold text-[var(--foreground)] md:text-3xl text-gray-700 mb-4">
        {page.title}
      </h1>
      {page.content && (
        <SanitizedHtml
          html={page.content.replace(/\n/g, '<br>')}
          className="prose prose-sm max-w-none text-gray-700"
        />
      )}
    </div>
  );

  return (
    <section className="min-h-[40vh]">
      {hasLayout ? (
        <div className="space-y-8">
          {basicContentBlock}
          {layout.rows.map((row) => {
            const marginClass = [
              row.marginTop === true ? 'mt-4' : '',
              row.marginBottom === true ? 'mb-4' : '',
            ].filter(Boolean).join(' ');
            return row.useContainer !== false ? (
              <Container key={row.id} className={`py-0 ${marginClass}`.trim()}>
                <RowGrid row={row} />
              </Container>
            ) : (
              <div key={row.id} className={`w-full ${marginClass}`.trim()}>
                <RowGrid row={row} />
              </div>
            );
          })}
          <Container>{bottomNav}</Container>
        </div>
      ) : (
        <Container>
          {basicContentBlock}
          {showBasicContent && !page.content && (
            <p className="text-white/70">Belum ada konten.</p>
          )}
          {bottomNav}
        </Container>
      )}
    </section>
  );
}
