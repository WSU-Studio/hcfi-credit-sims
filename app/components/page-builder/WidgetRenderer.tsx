import type { ComponentType } from 'react';
import type { LayoutCell } from '@/app/types';
import { TextWidget } from './TextWidget';
import { TextImageWidget } from './TextImageWidget';

type WidgetRendererProps = {
  cell: LayoutCell;
  fullWidth?: boolean;
};

const WIDGET_MAP: Record<string, ComponentType<{ cell: LayoutCell; fullWidth?: boolean }>> = {
  text: TextWidget,
  text_image: TextImageWidget,
};

export function WidgetRenderer({ cell, fullWidth }: WidgetRendererProps) {
  const Component = WIDGET_MAP[cell.widgetType];
  if (!Component) return null;
  return <Component cell={cell} fullWidth={fullWidth} />;
}
