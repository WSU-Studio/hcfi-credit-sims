/**
 * Utilitas bersama untuk page builder layout (Static Pages & Promos).
 */

import type { LayoutCell, LayoutRow, WidgetType } from '@/app/types';

export function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_TEXT_PAYLOAD = {
  content: '',
  contentEn: '',
  textColor: '#0f172a',
  textAlign: 'left' as const,
  textSize: '16' as const,
  textWeight: 'normal' as const,
};

function createEmptyCtaButton() {
  return {
    id: generateId(),
    label: '',
    labelEn: '',
    url: '',
    openInNewTab: false,
  };
}

export function createEmptyCell(widgetType: WidgetType = 'text'): LayoutCell {
  const id = generateId();
  if (widgetType === 'text' || widgetType === 'rich_text') {
    return {
      id,
      widgetType,
      payload: { ...DEFAULT_TEXT_PAYLOAD },
    };
  }
  if (widgetType === 'cta') {
    return {
      id,
      widgetType: 'cta',
      payload: {
        buttons: [createEmptyCtaButton(), createEmptyCtaButton(), createEmptyCtaButton()],
        align: 'left',
        direction: 'row',
        variant: 'primary',
        size: 'md',
        gap: 'md',
        fullWidth: false,
      },
    };
  }
  return {
    id,
    widgetType: 'text_image',
    payload: {
      title: '',
      body: '',
      imageUrl: '',
      imagePosition: 'left',
      imageRatio: 'default',
      textColor: '#0f172a',
      textPlacement: 'outside',
      textAlign: 'left',
      textSize: '16',
      textWeight: 'normal',
    },
  };
}

export function createEmptyRow(gridCols: 1 | 2 | 3 = 1): LayoutRow {
  const cells: LayoutCell[] = [];
  for (let i = 0; i < gridCols; i++) {
    cells.push(createEmptyCell());
  }
  return {
    id: generateId(),
    gridCols,
    cells,
    useContainer: true,
    marginTop: false,
    marginBottom: false,
  };
}
