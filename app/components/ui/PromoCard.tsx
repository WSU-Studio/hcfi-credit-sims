import Image from 'next/image';
import Link from 'next/link';

type PromoCardProps = {
  title: string;
  description: string | null;
  imageUrl: string | null;
  slug: string;
  isHighlight?: boolean;
  className?: string;
};

export function PromoCard({
  title,
  description,
  imageUrl,
  slug,
  isHighlight,
  className = '',
}: PromoCardProps) {
  const base =
    'group relative block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg shadow-black/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 hover:scale-[1.02]';

  const placeholderBg = 'bg-slate-700/80';
  const imageSrc = imageUrl?.trim() || '';

  return (
    <Link
      href={`/promo/${slug}`}
      className={className ? `${base} ${className}` : base}
      aria-label={title}
    >
      <div className="aspect-[4/3] relative w-full overflow-hidden">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            width={400}
            height={300}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div
            className={`absolute inset-0 flex items-center justify-center ${placeholderBg}`}
            aria-hidden
          >
            <span className="text-4xl font-bold text-white/40">Promo</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        {isHighlight && (
          <span className="absolute top-3 right-3 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow">
            Highlight
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-lg font-semibold text-white leading-tight line-clamp-2">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-white/85 line-clamp-2">{description}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
