import type { Product } from "@/app/types";
import Image from "next/image";

type ProductCardProps = Product & {
  className?: string;
};

export function ProductCard({ title, subtitle, image, className }: ProductCardProps) {
  const base =
    "relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg shadow-black/40 aspect-[5/2] md:aspect-[4/3]";
  const backgroundImage = image ? { backgroundImage: `url(${image})` } : undefined;

  return (
    <div className={className ? `${base} ${className}` : base} role="img" aria-label={title}>
      <Image
        src={image}
        alt={title}
        width={1000}
        height={1000}
        className="absolute top-0 left-0 right-0 bottom-0 min-w-full min-h-full w-auto h-auto object-cover"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent" />
      <div className="relative flex h-full flex-col justify-end gap-1 p-4">
        <p className="text-lg font-semibold text-white leading-snug">{title}</p>
        {subtitle ? (
          <p className="text-sm text-[var(--muted)] leading-snug">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

