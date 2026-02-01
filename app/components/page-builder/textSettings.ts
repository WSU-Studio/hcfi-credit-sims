/**
 * Shared text settings untuk widget page-builder (TextWidget, TextImageWidget).
 * Memusatkan konstanta dan resolusi class/style agar tidak duplikasi.
 */

import type { CSSProperties } from 'react';

export const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const TEXT_SIZE_CLASSES: Record<string, string> = {
  '12': 'text-[12px]',
  '16': 'text-[16px]',
  '20': 'text-[20px]',
  '24': 'text-[24px]',
  '32': 'text-[32px]',
  '40': 'text-[40px]',
  '48': 'text-[48px]',
  '56': 'text-[56px]',
  '64': 'text-[64px]',
};

export const TEXT_COLOR_CLASSES: Record<string, string> = {
  'slate-900': 'text-slate-900',
  'slate-700': 'text-slate-700',
  'slate-600': 'text-slate-600',
  'gray-900': 'text-gray-900',
  'gray-800': 'text-gray-800',
  'gray-700': 'text-gray-700',
  white: 'text-white',
};

export const TEXT_ALIGN_CLASSES: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

/** Sesuai font HyundaiSans di public/fonts: Light 300, Regular 400, Medium 500, Bold 700 */
export const TEXT_WEIGHT_CLASSES: Record<string, string> = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  bold: 'font-bold',
};

export type TextSettingsPayload = {
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textSize?: '12' | '16' | '20' | '24' | '32' | '40' | '48' | '56' | '64';
  textWeight?: 'light' | 'normal' | 'medium' | 'bold';
};

const DEFAULTS: Required<TextSettingsPayload> = {
  textColor: 'slate-900',
  textAlign: 'left',
  textSize: '16',
  textWeight: 'normal',
};

export type TextSettingsResult = {
  className: string;
  style: CSSProperties;
};

/**
 * Mengubah payload pengaturan teks menjadi className dan style untuk diterapkan ke wrapper.
 */
export function getTextSettingsClasses(
  payload: TextSettingsPayload | null | undefined
): TextSettingsResult {
  const p = payload ?? {};
  const textColor = p.textColor ?? DEFAULTS.textColor;
  const textAlign = p.textAlign ?? DEFAULTS.textAlign;
  const textSize = p.textSize ?? DEFAULTS.textSize;
  const textWeight = p.textWeight ?? DEFAULTS.textWeight;

  const textSizeClass = TEXT_SIZE_CLASSES[textSize] ?? TEXT_SIZE_CLASSES['16'];
  const textAlignClass = TEXT_ALIGN_CLASSES[textAlign] ?? TEXT_ALIGN_CLASSES.left;
  const textWeightClass = TEXT_WEIGHT_CLASSES[textWeight] ?? TEXT_WEIGHT_CLASSES.normal;

  const isHexColor = typeof textColor === 'string' && HEX_COLOR_REGEX.test(textColor);
  const textColorClass = !isHexColor
    ? (TEXT_COLOR_CLASSES[textColor] ?? TEXT_COLOR_CLASSES['slate-900'])
    : '';

  const className = [textSizeClass, textAlignClass, textWeightClass, textColorClass].filter(Boolean).join(' ');
  const style: CSSProperties = isHexColor ? { color: textColor } : {};

  return { className, style };
}

/** Nilai hex untuk preset warna (untuk color picker display) */
export const PRESET_HEX: Record<string, string> = {
  'slate-900': '#0f172a',
  'slate-700': '#334155',
  'slate-600': '#475569',
  'gray-900': '#111827',
  'gray-800': '#1f2937',
  'gray-700': '#374151',
  white: '#ffffff',
};

export const DEFAULT_TEXT_COLOR_HEX = '#0f172a';
