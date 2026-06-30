import type { LayoutCell } from '@/app/types';
import { SanitizedHtml } from '@/app/components/ui/SanitizedHtml';
import { pickLocaleString } from '@/lib/pick-locale';
import type { Locale } from '@/lib/pick-locale';
import { getTextSettingsClasses } from './textSettings';
import {
  RICH_TEXT_ALLOWED_ATTR,
  RICH_TEXT_ALLOWED_TAGS,
  RICH_TEXT_PROSE_CLASSES,
} from './richTextSanitize';

type RichTextWidgetProps = {
  cell: LayoutCell;
  fullWidth?: boolean;
  locale?: Locale;
};

function isEmptyHtml(html: string): boolean {
  const stripped = html
    .replace(/<p><\/p>/gi, '')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '')
    .trim();
  return stripped.length === 0;
}

export function RichTextWidget({ cell, locale = 'id' }: RichTextWidgetProps) {
  const contentId = (cell.payload?.content as string) ?? '';
  const contentEn = (cell.payload?.contentEn as string) ?? '';
  const raw = pickLocaleString(contentId, contentEn || undefined, locale);
  if (!raw.trim() || isEmptyHtml(raw)) return null;

  const { className: textSettingsClassName, style: textSettingsStyle } =
    getTextSettingsClasses(cell.payload);

  return (
    <div
      className={`prose prose-invert max-w-none ${RICH_TEXT_PROSE_CLASSES} ${textSettingsClassName}`.trim()}
      style={textSettingsStyle}
    >
      <SanitizedHtml
        html={raw}
        allowedTags={RICH_TEXT_ALLOWED_TAGS}
        allowedAttr={RICH_TEXT_ALLOWED_ATTR}
      />
    </div>
  );
}
