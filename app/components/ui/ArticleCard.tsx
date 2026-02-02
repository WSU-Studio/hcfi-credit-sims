import type { Article } from "@/app/types";
import Image from "next/image";
import Link from "next/link";

type ArticleCardProps = Article & {
  className?: string;
  slug?: string;
};

export function ArticleCard({ title, image, className, slug }: ArticleCardProps) {
  const base =
    "relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg shadow-black/40 aspect-[5/2] md:aspect-[4/3]";

  const getImageUrl = (url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const urlHash = url.split("").reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0);
    }, 0);
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}cb=${Math.abs(urlHash)}`;
  };

  const imageSrc = getImageUrl(image);

  const content = (
    <>
      <Image
        src={imageSrc}
        alt={title}
        width={1000}
        height={1000}
        className="absolute top-0 left-0 right-0 bottom-0 min-w-full min-h-full w-auto h-auto object-cover"
        aria-hidden="true"
        key={imageSrc}
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent" />
      <div className="relative flex h-full flex-col justify-end gap-1 p-4">
        <p className="text-lg font-semibold text-white leading-snug line-clamp-2">{title}</p>
      </div>
    </>
  );

  if (slug) {
    return (
      <Link
        href={`/articles/${slug}`}
        className={className ? `${base} ${className} block` : `${base} block`}
        role="img"
        aria-label={title}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={className ? `${base} ${className}` : base} role="img" aria-label={title}>
      {content}
    </div>
  );
}
