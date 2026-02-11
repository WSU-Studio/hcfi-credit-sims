import type { Product } from "@/app/types";
import { Container } from "../ui/Container";
import { ProductCard } from "../ui/ProductCard";
import { IconStack2Filled } from "@tabler/icons-react";
import Link from "next/link";

type ProductSectionProps = {
  title: string;
  products: Product[];
};

export function ProductSection({ title, products }: ProductSectionProps) {
  return (
    <section id="products" className="bg-[var(--background)] pt-12 md:pt-16">
      <Container className="space-y-6 pb-12 md:pb-20 border-b border-[var(--border)]">
        <div className="space-y-2 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] md:text-3xl">{title}</h2>

          <Link href="/products" className="inline-flex items-center justify-center py-2.5 transition-colors duration-300 text-slate-700">
            <span className="text-sm text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-2">
              <IconStack2Filled size={16} />
              <span>Lihat Semua Produk</span>
            </span>
          </Link>
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


