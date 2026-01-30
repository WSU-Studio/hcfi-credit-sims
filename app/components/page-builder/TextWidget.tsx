import DOMPurify from 'isomorphic-dompurify';
import type { LayoutCell } from '@/app/types';

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
  return (
    <div
      className="prose prose-invert prose-sm max-w-none text-white/90"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
