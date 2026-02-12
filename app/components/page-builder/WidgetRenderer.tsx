import type { ComponentType } from 'react';
import type { LayoutCell } from '@/app/types';
import type { Locale } from '@/lib/pick-locale';
import { TextWidget } from './TextWidget';
import { TextImageWidget } from './TextImageWidget';

export type WidgetRendererProps = {
  cell: LayoutCell;
  fullWidth?: boolean;
  locale?: Locale;
};

type WidgetComponentProps = WidgetRendererProps;

const WIDGET_MAP: Record<string, ComponentType<WidgetComponentProps>> = {
  text: TextWidget,
  text_image: TextImageWidget,
};

export function WidgetRenderer({ cell, fullWidth, locale = 'id' }: WidgetRendererProps) {
  const Component = WIDGET_MAP[cell.widgetType];
  if (!Component) return null;
  return <Component cell={cell} fullWidth={fullWidth} locale={locale} />;
}
