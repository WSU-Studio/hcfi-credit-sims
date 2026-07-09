'use client';

import type { Article } from "@/app/types";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/app/components/ui/Container";
import { ArticleCard } from "@/app/components/ui/ArticleCard";
import { Link } from "@/i18n/navigation";
import { IconStack2Filled } from "@tabler/icons-react";

type ArticleSectionProps = {
  articles: Article[];
  titleOverrideId?: string;
  titleOverrideEn?: string;
};

export function ArticleSection({ articles, titleOverrideId, titleOverrideEn }: ArticleSectionProps) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const sectionTitle =
    (locale === "en" ? titleOverrideEn : titleOverrideId)?.trim() || t("articlesTitle");
  if (!articles.length) return null;

  return (
    <section id="artikel" className="bg-[var(--background)] pt-12 md:pt-16 pb-4 md:pb-6">
      <Container className="space-y-6 px-4 md:px-0">
        <div className="space-y-2 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] md:text-3xl">
            {sectionTitle}
          </h2>

          <Link href="/articles" className="inline-flex items-center justify-center py-2.5 transition-colors duration-300 text-slate-700">
            <span className="text-sm text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-2">
              <IconStack2Filled size={16} />
              <span>{tCommon("viewAllArticles")}</span>
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
