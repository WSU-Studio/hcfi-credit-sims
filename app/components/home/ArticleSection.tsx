import type { Article } from "@/app/types";
import { Container } from "../ui/Container";
import { ArticleCard } from "../ui/ArticleCard";

type ArticleSectionProps = {
  articles: Article[];
};

export function ArticleSection({ articles }: ArticleSectionProps) {
  if (!articles.length) return null;

  return (
    <section id="artikel" className="bg-[var(--background)] py-12 md:py-16">
      <Container className="space-y-6">
        <div className="space-y-2">
          {/* <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Artikel</p> */}
          <h2 className="text-2xl font-semibold text-[var(--foreground)] md:text-3xl">
            Artikel
          </h2>
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
