import type { Article } from "@/app/types";
import { Container } from "../ui/Container";
import { ArticleCard } from "../ui/ArticleCard";
import Link from "next/link";
import { IconArrowBadgeUpFilled } from "@tabler/icons-react";

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

          <Link href="/articles" className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100/80 rounded-lg hover:bg-slate-200 transition-colors duration-300 text-slate-700">
            <span className="text-sm font-semibold text-slate-700">
              Lihat Semua Artikel
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
