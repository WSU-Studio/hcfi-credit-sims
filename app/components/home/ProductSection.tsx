import type { Product } from "@/app/types";
import { Container } from "../ui/Container";
import { ProductCard } from "../ui/ProductCard";

type ProductSectionProps = {
  title: string;
  products: Product[];
};

export function ProductSection({ title, products }: ProductSectionProps) {
  return (
    <section id="products" className="bg-[var(--background)] pt-12 md:pt-16">
      <Container className="space-y-6 pb-12 md:pb-20 border-b border-[var(--border)]">
        <div className="space-y-2">
          {/* <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
            Kredit Pintar
          </p> */}
          <h2 className="text-2xl font-semibold text-[var(--foreground)] md:text-3xl">{title}</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id ?? product.title} {...product} />
          ))}
        </div>
      </Container>
    </section>
  );
}


