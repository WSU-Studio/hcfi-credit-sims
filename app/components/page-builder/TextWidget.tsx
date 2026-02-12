import type { LayoutCell } from '@/app/types';
import { pickLocaleString } from '@/lib/pick-locale';
import type { Locale } from '@/lib/pick-locale';
import { getTextSettingsClasses } from './textSettings';
import { SanitizedHtml } from '@/app/components/ui/SanitizedHtml';

type TextWidgetProps = {
  cell: LayoutCell;
  fullWidth?: boolean;
  locale?: Locale;
};

export function TextWidget({ cell, locale = 'id' }: TextWidgetProps) {
  const contentId = (cell.payload?.content as string) ?? '';
  const contentEn = (cell.payload?.contentEn as string) ?? '';
  const raw = pickLocaleString(contentId, contentEn || undefined, locale);
  if (!raw.trim()) return null;
  const { className: textSettingsClassName, style: textSettingsStyle } =
    getTextSettingsClasses(cell.payload);
  const htmlWithBreaks = raw.replace(/\n/g, '<br>');

  return (
    <div
      className={`prose prose-invert max-w-none ${textSettingsClassName}`.trim()}
      style={textSettingsStyle}
    >
      <SanitizedHtml html={htmlWithBreaks} />
    </div>
  );
}
