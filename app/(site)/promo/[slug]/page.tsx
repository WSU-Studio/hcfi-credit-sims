import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Container } from '@/app/components/ui/Container';
import { SanitizedHtml } from '@/app/components/ui/SanitizedHtml';
import { WidgetRenderer } from '@/app/components/page-builder/WidgetRenderer';
import type { PageLayout, LayoutRow } from '@/app/types';
import { getActivePromos } from '../page';

export const dynamic = 'force-dynamic';

async function getPromoBySlug(slug: string) {
  try {
    return await prisma.promo.findFirst({
      where: {
        slug,
        isActive: true,
      },
    });
  } catch (error) {
    console.error('Error fetching promo:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);
  const promo = await getPromoBySlug(slug);
  if (!promo) return { title: 'Hyundai Capital' };
  return {
    title: `Hyundai Capital - ${promo.title}`,
  };
}

export default async function PromoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);
  const promo = await getPromoBySlug(slug);
  if (!promo) notFound();

  const layout = promo.layout as PageLayout | null;
  const hasLayout =
    layout &&
    typeof layout === 'object' &&
    Array.isArray(layout?.rows) &&
    layout.rows.length > 0;

  const promos = await getActivePromos();

  const currentIndex = promos.findIndex((p) => p.slug === slug);
  const nextSlug =
    currentIndex >= 0 && currentIndex < promos.length - 1
      ? promos[currentIndex + 1].slug
      : null;
  const previousSlug =
    currentIndex >= 0 && currentIndex > 0
      ? promos[currentIndex - 1].slug
      : null;

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
    <div className="mt-8 flex flex-wrap items-center justify-between pt-6 border-t border-slate-300/50">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100/80 rounded-lg hover:bg-slate-200 transition-colors duration-300 border border-slate-500"
        >
          <span className="text-sm font-semibold text-slate-700">
            Kembali ke Beranda
          </span>
        </Link>
        <Link
          href="/promo"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100/80 rounded-lg hover:bg-slate-200 transition-colors duration-300 border border-slate-500"
        >
          <span className="text-sm font-semibold text-slate-700">
            Lihat Semua Promo
          </span>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {nextSlug && (
          <Link
            href={`/promo/${nextSlug}`}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100/80 rounded-lg hover:bg-slate-200 transition-colors duration-300 border border-slate-500"
          >
            <span className="text-sm font-semibold text-slate-700">
              Lihat Promo Berikutnya
            </span>
          </Link>
        )}
        {previousSlug && (
          <Link
            href={`/promo/${previousSlug}`}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100/80 rounded-lg hover:bg-slate-200 transition-colors duration-300 border border-slate-500"
          >
            <span className="text-sm font-semibold text-slate-700">
              Lihat Promo Sebelumnya
            </span>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <section className="min-h-[40vh]">
      {hasLayout ? (
        <div className="space-y-8">
          {layout.rows.map((row) => {
            const marginClass = [
              row.marginTop === true ? 'mt-4' : '',
              row.marginBottom === true ? 'mb-4' : '',
            ]
              .filter(Boolean)
              .join(' ');
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
          {promo.content ? (
            <SanitizedHtml
              html={promo.content}
              className="prose prose-sm max-w-none"
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
