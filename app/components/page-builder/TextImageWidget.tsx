import Image from 'next/image';
import type { LayoutCell } from '@/app/types';

type TextImageWidgetProps = {
  cell: LayoutCell;
};

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const TEXT_COLOR_CLASSES: Record<string, string> = {
  'slate-900': 'text-slate-900',
  'slate-700': 'text-slate-700',
  'slate-600': 'text-slate-600',
  'gray-900': 'text-gray-900',
  'gray-800': 'text-gray-800',
  'gray-700': 'text-gray-700',
  white: 'text-white',
};

const RATIO_CLASSES: Record<string, string> = {
  default: '',
  '1:1': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '16:9': 'aspect-video',
  '3:1': 'aspect-[3/1]',
  '4:1': 'aspect-[4/1]',
  '5:1': 'aspect-[5/1]',
};

function ImageBlock({
  imageUrl,
  alt,
  imageRatio,
}: {
  imageUrl: string;
  alt: string;
  imageRatio: string;
}) {
  const ratioClass = RATIO_CLASSES[imageRatio] ?? '';
  const isDefaultRatio = imageRatio === 'default' || !ratioClass;

  const wrapperClass = `relative flex-shrink-0 overflow-hidden rounded-lg bg-white/10 w-full ${ratioClass}`;

  if (isDefaultRatio) {
    return (
      <div className={wrapperClass}>
        {imageUrl.startsWith('http') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-auto object-cover"
          />
        ) : (
          <Image
            src={imageUrl}
            alt={alt}
            width={800}
            height={450}
            className="w-full h-auto object-cover"
            unoptimized
          />
        )}
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {imageUrl.startsWith('http') ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover"
          unoptimized
        />
      )}
    </div>
  );
}

export function TextImageWidget({ cell }: TextImageWidgetProps) {
  const payload = cell.payload as {
    title?: string;
    body?: string;
    imageUrl?: string;
    imagePosition?: 'left' | 'right' | 'above' | 'below';
    imageRatio?: 'default' | '1:1' | '4:3' | '16:9' | '3:1' | '4:1' | '5:1';
    textColor?: string;
  };
  const {
    title,
    body,
    imageUrl,
    imagePosition = 'left',
    imageRatio = 'default',
    textColor = 'slate-900',
  } = payload ?? {};
  const isHexColor = typeof textColor === 'string' && HEX_COLOR_REGEX.test(textColor);
  const textColorClass = !isHexColor
    ? (TEXT_COLOR_CLASSES[textColor] ?? TEXT_COLOR_CLASSES['slate-900'])
    : undefined;
  const textColorStyle = isHexColor ? { color: textColor } : undefined;
  const hasImage = imageUrl && imageUrl.trim().length > 0;
  const hasText = (title && title.trim()) || (body && body.trim());
  const isVertical = imagePosition === 'above' || imagePosition === 'below';
  const imageFirst = imagePosition === 'above' || imagePosition === 'left';
  const imageOnly = hasImage && !hasText;

  const wrapperClass = isVertical
    ? 'flex flex-col gap-4'
    : imagePosition === 'right'
      ? 'flex flex-col md:flex-row-reverse md:items-start md:gap-6'
      : 'flex flex-col md:flex-row md:items-start md:gap-6';

  // When only image (no text), image occupies row fully; otherwise side-by-side uses 1/3
  const imageWidthClass =
    isVertical || imageOnly ? 'w-full' : 'w-full md:w-1/3';

  const imageBlock =
    hasImage && imageUrl ? (
      <div className={imageWidthClass}>
        <ImageBlock
          imageUrl={imageUrl}
          alt={title?.trim() ?? 'Image'}
          imageRatio={imageRatio}
        />
      </div>
    ) : null;

  const textBlock = hasText ? (
    <div
      className={`flex-1 min-w-0 ${textColorClass ?? ''}`.trim()}
      style={textColorStyle}
    >
      {title?.trim() && (
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
      )}
      {body?.trim() && (
        <div className="text-sm leading-relaxed whitespace-pre-wrap opacity-90">
          {body}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className={`${wrapperClass} w-full`}>
      {imageFirst ? (
        <>
          {imageBlock}
          {textBlock}
        </>
      ) : (
        <>
          {textBlock}
          {imageBlock}
        </>
      )}
    </div>
  );
}
