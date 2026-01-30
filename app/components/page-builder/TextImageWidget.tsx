import Image from 'next/image';
import type { LayoutCell } from '@/app/types';

type TextImageWidgetProps = {
  cell: LayoutCell;
};

export function TextImageWidget({ cell }: TextImageWidgetProps) {
  const payload = cell.payload as {
    title?: string;
    body?: string;
    imageUrl?: string;
    imagePosition?: 'left' | 'right';
  };
  const { title, body, imageUrl, imagePosition = 'left' } = payload ?? {};
  const hasImage = imageUrl && imageUrl.trim().length > 0;

  return (
    <div
      className={`flex flex-col gap-4 ${imagePosition === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} md:items-start md:gap-6`}
    >
      {hasImage && (
        <div className="relative w-full md:w-1/3 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-white/10">
          {imageUrl.startsWith('http') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title ?? 'Image'}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={imageUrl}
              alt={title ?? 'Image'}
              fill
              className="object-cover"
              unoptimized
            />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        )}
        {body && (
          <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
            {body}
          </div>
        )}
      </div>
    </div>
  );
}
