import Image from 'next/image';
import type { LayoutCell } from '@/app/types';
import { getTextSettingsClasses } from './textSettings';

type TextImageWidgetProps = {
  cell: LayoutCell;
  fullWidth?: boolean;
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
  fullWidth,
}: {
  imageUrl: string;
  alt: string;
  imageRatio: string;
  fullWidth?: boolean;
}) {
  const ratioClass = RATIO_CLASSES[imageRatio] ?? '';
  const isDefaultRatio = imageRatio === 'default' || !ratioClass;
  const roundedClass = fullWidth ? '' : 'rounded-xl';

  const wrapperClass = [
    'relative flex-shrink-0 overflow-hidden',
    roundedClass,
    'bg-white/10 w-full',
    ratioClass,
  ].filter(Boolean).join(' ');

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

export function TextImageWidget({ cell, fullWidth }: TextImageWidgetProps) {
  const payload = cell.payload as {
    title?: string;
    body?: string;
    imageUrl?: string;
    imagePosition?: 'left' | 'right' | 'above' | 'below';
    imageRatio?: 'default' | '1:1' | '4:3' | '16:9' | '3:1' | '4:1' | '5:1';
    textColor?: string;
    textPlacement?: 'inside' | 'outside';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    textSize?: '12' | '16' | '20' | '24' | '32' | '40' | '48' | '56' | '64';
  };
  const {
    title,
    body,
    imageUrl,
    imagePosition = 'left',
    imageRatio = 'default',
    textPlacement = 'outside',
  } = payload ?? {};
  const { className: textSettingsClassName, style: textSettingsStyle } =
    getTextSettingsClasses(payload);
  const hasImage = imageUrl && imageUrl.trim().length > 0;
  const hasText = (title && title.trim()) || (body && body.trim());
  const isVertical = imagePosition === 'above' || imagePosition === 'below';
  // "Di kiri gambar" = teks di kiri → [Teks, Gambar]. "Di kanan gambar" = teks di kanan → [Gambar, Teks].
  const imageFirst = imagePosition === 'right' || imagePosition === 'below';
  const imageOnly = hasImage && !hasText;
  const textInside = textPlacement === 'inside' && hasImage && hasText;

  const wrapperClass = isVertical
    ? 'flex flex-col gap-4'
    : 'flex flex-col md:flex-row md:items-start md:gap-6';

  // Teks di dalam gambar atau hanya gambar: gambar penuh lebar; teks di luar + kiri/kanan: gambar 1/3
  const imageWidthClass =
    textInside || isVertical || imageOnly ? 'w-full' : 'w-full md:w-1/3';

  const overlayPositionClass = {
    left: 'justify-start items-center',
    right: 'justify-end items-center',
    above: 'justify-center items-start',
    below: 'justify-center items-end',
  }[imagePosition];

  const overlayGradientClass = {
    left: 'bg-gradient-to-r from-black/50 to-transparent',
    right: 'bg-gradient-to-l from-black/50 to-transparent',
    above: 'bg-gradient-to-b from-black/50 to-transparent',
    below: 'bg-gradient-to-t from-black/50 to-transparent',
  }[imagePosition];

  const textBlockContent = hasText ? (
    <div
      className={`flex flex-col min-w-0 max-w-full ${textSettingsClassName}`.trim()}
      style={textSettingsStyle}
    >
      {title?.trim() && (
        <h3 className="font-semibold mb-2">{title}</h3>
      )}
      {body?.trim() && (
        <div className="leading-relaxed whitespace-pre-wrap opacity-90">
          {body}
        </div>
      )}
    </div>
  ) : null;

  const textBlock =
    !textInside && hasText ? (
      <div className="flex-1 min-w-0">
        {textBlockContent}
      </div>
    ) : null;

  const imageBlock =
    hasImage && imageUrl ? (
      <div className={imageWidthClass}>
        {textInside ? (
          <div className="relative w-full">
            <ImageBlock
              imageUrl={imageUrl}
              alt={title?.trim() ?? 'Image'}
              imageRatio={imageRatio}
              fullWidth={fullWidth}
            />
            <div
              className={`absolute inset-0 flex p-4 md:p-6 ${overlayPositionClass} ${overlayGradientClass}`}
              aria-hidden={false}
            >
              <div className="max-w-full">{textBlockContent}</div>
            </div>
          </div>
        ) : (
          <ImageBlock
            imageUrl={imageUrl}
            alt={title?.trim() ?? 'Image'}
            imageRatio={imageRatio}
            fullWidth={fullWidth}
          />
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
