/**
 * Utilitas bersama untuk page builder layout (Static Pages & Promos).
 */

import type { LayoutCell, LayoutRow } from '@/app/types';

export function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyCell(widgetType: 'text' | 'text_image' = 'text'): LayoutCell {
  const id = generateId();
  if (widgetType === 'text') {
    return {
      id,
      widgetType: 'text',
      payload: {
        content: '',
        textColor: '#0f172a',
        textAlign: 'left',
        textSize: '16',
        textWeight: 'normal',
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
