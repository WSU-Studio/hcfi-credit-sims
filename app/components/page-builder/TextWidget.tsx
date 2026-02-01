import type { LayoutCell } from '@/app/types';
import { getTextSettingsClasses } from './textSettings';
import { SanitizedHtml } from '@/app/components/ui/SanitizedHtml';

type TextWidgetProps = {
  cell: LayoutCell;
  fullWidth?: boolean;
};

export function TextWidget({ cell }: TextWidgetProps) {
  const raw = (cell.payload?.content as string) ?? '';
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
