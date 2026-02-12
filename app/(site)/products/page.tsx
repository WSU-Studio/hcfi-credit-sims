import { prisma } from '@/lib/prisma';
import { Container } from '@/app/components/ui/Container';
import { ProductCard } from '@/app/components/ui/ProductCard';
import type { Product } from '@/app/types';

export const dynamic = 'force-dynamic';

async function getAllProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    orderBy: { order: 'asc' },
  });
  return products.map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: p.subtitle ?? undefined,
    image: p.imageUrl,
  }));
}

export async function generateMetadata() {
  return {
    title: 'Hyundai Capital - Produk',
    description: 'Produk kredit dan program pembiayaan dari Hyundai Capital.',
  };
}

export default async function ProductsListPage() {
  const products = await getAllProducts();

  return (
    <section className="min-h-[40vh] py-8 md:py-12">
      <Container className="space-y-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)] md:text-3xl">
            Semua Produk
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Program kredit dan pembiayaan dari Hyundai Capital untuk kebutuhan Anda
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <p className="text-[var(--muted-foreground)]">
              Belum ada produk saat ini.
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
