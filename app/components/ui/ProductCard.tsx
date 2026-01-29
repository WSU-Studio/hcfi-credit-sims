import type { Product } from "@/app/types";
import Image from "next/image";

type ProductCardProps = Product & {
  className?: string;
};

export function ProductCard({ title, subtitle, image, className }: ProductCardProps) {
  const base =
    "relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg shadow-black/40 aspect-[5/2] md:aspect-[4/3]";

  // Add cache busting for local images - use URL hash to force reload when URL changes
  const getImageUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // For local images, add a hash-based cache buster that changes when URL changes
    // This ensures browser reloads when image is updated even with same filename
    const urlHash = url.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}cb=${Math.abs(urlHash)}`;
  };

  const imageSrc = getImageUrl(image);

  return (
    <div className={className ? `${base} ${className}` : base} role="img" aria-label={title}>
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
        <p className="text-lg font-semibold text-white leading-snug">{title}</p>
        {subtitle ? (
          <p className="text-sm text-gray-300 leading-snug">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

