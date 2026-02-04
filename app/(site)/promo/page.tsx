import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { Container } from '@/app/components/ui/Container';
import { PromoCard } from '@/app/components/ui/PromoCard';

export const dynamic = 'force-dynamic';

export async function getActivePromos() {
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
  } as Prisma.PromoWhereInput;
  const promos = await prisma.promo.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      imageUrl: true,
      isHighlight: true,
    },
  });
  return promos.filter((p): p is typeof p & { slug: string } => p.slug != null);
}

export async function generateMetadata() {
  return {
    title: 'Hyundai Capital - Promosi',
    description: 'Lihat promosi dan penawaran terbaru dari Hyundai Capital.',
  };
}

export default async function PromoListPage() {
  const promos = await getActivePromos();

  return (
    <section className="min-h-[40vh] py-8 md:py-12">
      <Container>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
            Promosi
          </h1>
          <p className="mt-1 text-slate-600">
            Penawaran dan promosi dari Hyundai Capital
          </p>
        </div>

        {promos.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <p className="text-[var(--muted-foreground)]">
              Belum ada promosi aktif saat ini.
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
