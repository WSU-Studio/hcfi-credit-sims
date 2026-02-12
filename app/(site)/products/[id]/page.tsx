import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { Container } from '@/app/components/ui/Container';
import { SanitizedHtml } from '@/app/components/ui/SanitizedHtml';
import { WidgetRenderer } from '@/app/components/page-builder/WidgetRenderer';
import type { PageLayout, LayoutRow } from '@/app/types';

export const dynamic = 'force-dynamic';

async function getProductById(id: string) {
  try {
    return await prisma.product.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await Promise.resolve(params);
  const product = await getProductById(id);
  if (!product) return { title: 'Hyundai Capital' };
  return {
    title: `Hyundai Capital - ${product.title}`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await Promise.resolve(params);
  const product = await getProductById(id);
  if (!product) notFound();

  const layout = (product as { layout?: unknown }).layout as PageLayout | null;
  const hasLayout =
    layout &&
    typeof layout === 'object' &&
    Array.isArray(layout?.rows) &&
    layout.rows.length > 0;

  const imageUrl = product.imageUrl?.trim() || null;

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
        href="/#products"
        className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100/80 rounded-lg hover:bg-slate-200 transition-colors duration-300 border border-slate-500"
      >
        <span className="text-sm font-semibold text-slate-700">
          Kembali ke Daftar Produk
        </span>
      </Link>
    </div>
  );

  const bannerWrapperClass =
    'relative w-full overflow-hidden bg-[var(--card)] rounded-xl border border-[var(--border)] aspect-video';

  if (hasLayout) {
    return (
      <section className="min-h-[40vh] py-8 md:py-12">
        <Container>
          <header className="mb-8 space-y-4">
            {imageUrl && (
              <div className={bannerWrapperClass}>
                <Image
                  src={imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
            )}
            <h1 className="text-2xl font-bold text-[var(--foreground)] md:text-3xl leading-tight">
              {product.title}
            </h1>
            {product.subtitle && (
              <p className="text-lg text-[var(--muted-foreground)]">
                {product.subtitle}
              </p>
            )}
          </header>
        </Container>

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
      </section>
    );
  }

  return (
    <section className="min-h-[40vh] py-8 md:py-12">
      <Container>
        <article className="w-full">
          <header className="space-y-4">
            {imageUrl && (
              <div className={bannerWrapperClass}>
                <Image
                  src={imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
            )}
            <h1 className="text-2xl font-bold text-[var(--foreground)] md:text-3xl leading-tight">
              {product.title}
            </h1>
            {product.subtitle && (
              <p className="text-lg text-[var(--muted-foreground)]">
                {product.subtitle}
              </p>
            )}
          </header>

          <div className="mt-6 max-w-none text-slate-600 text-justify">
            {product.content ? (
              <SanitizedHtml
                html={product.content.replace(/\n/g, '<br>')}
                className="prose prose-sm max-w-none"
              />
            ) : (
              <p className="text-[var(--muted-foreground)]">Belum ada konten.</p>
            )}
          </div>

          {bottomNav}
        </article>
      </Container>
    </section>
  );
}
