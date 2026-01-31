import DOMPurify from 'isomorphic-dompurify';
import type { LayoutCell } from '@/app/types';
import { getTextSettingsClasses } from './textSettings';

type TextWidgetProps = {
  cell: LayoutCell;
};

export function TextWidget({ cell }: TextWidgetProps) {
  const raw = (cell.payload?.content as string) ?? '';
  if (!raw.trim()) return null;
  const content = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
  const { className: textSettingsClassName, style: textSettingsStyle } =
    getTextSettingsClasses(cell.payload);

  return (
    <div
      className={`prose prose-invert max-w-none ${textSettingsClassName}`.trim()}
      style={textSettingsStyle}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
