import type { Article } from "@/app/types";
import { Container } from "../ui/Container";
import { ArticleCard } from "../ui/ArticleCard";
import Link from "next/link";
import { IconStack2Filled } from "@tabler/icons-react";

type ArticleSectionProps = {
  articles: Article[];
};

export function ArticleSection({ articles }: ArticleSectionProps) {
  if (!articles.length) return null;

  return (
    <section id="artikel" className="bg-[var(--background)] pt-12 md:pt-16 pb-4 md:pb-6">
      <Container className="space-y-6">
        <div className="space-y-2 flex items-center justify-between">
          {/* <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Artikel</p> */}
          <h2 className="text-2xl font-semibold text-[var(--foreground)] md:text-3xl">
            Artikel
          </h2>

          <Link href="/articles" className="inline-flex items-center justify-center py-2.5 transition-colors duration-300 text-slate-700">
            <span className="text-sm text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-2">
              <IconStack2Filled size={16} />
              <span>Lihat Semua Artikel</span>
            </span>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.slug ?? article.title}
              title={article.title}
              image={article.image}
              slug={article.slug}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
