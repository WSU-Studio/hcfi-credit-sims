'use client';

import type { SharedTextSettings } from '@/app/types';
import {
  HEX_COLOR_REGEX,
  PRESET_HEX,
  DEFAULT_TEXT_COLOR_HEX,
} from '@/app/components/page-builder/textSettings';

type TextSettingsFieldsProps = {
  value: Partial<SharedTextSettings>;
  onChange: (patch: Partial<SharedTextSettings>) => void;
};

export function TextSettingsFields({ value, onChange }: TextSettingsFieldsProps) {
  const raw = value.textColor ?? DEFAULT_TEXT_COLOR_HEX;
  const isHex = HEX_COLOR_REGEX.test(raw);
  const displayHex = isHex ? raw : (PRESET_HEX[raw] ?? DEFAULT_TEXT_COLOR_HEX);

  return (
    <>
      <div>
        <label className="text-xs text-gray-500">Perataan teks</label>
        <select
          value={value.textAlign ?? 'left'}
          onChange={(e) =>
            onChange({
              textAlign: e.target.value as 'left' | 'center' | 'right' | 'justify',
            })
          }
          className="w-full mt-0.5 px-2 py-1.5 border border-gray-300 rounded"
        >
          <option value="left">Kiri</option>
          <option value="center">Tengah</option>
          <option value="right">Kanan</option>
          <option value="justify">Rata kanan-kiri (justify)</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500">Ketebalan teks (font weight)</label>
        <select
          value={value.textWeight ?? 'normal'}
          onChange={(e) =>
            onChange({
              textWeight: e.target.value as 'light' | 'normal' | 'medium' | 'bold',
            })
          }
          className="w-full mt-0.5 px-2 py-1.5 border border-gray-300 rounded"
        >
          <option value="light">Light (300)</option>
          <option value="normal">Regular (400)</option>
          <option value="medium">Medium (500)</option>
          <option value="bold">Bold (700)</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500">Ukuran teks</label>
        <select
          value={value.textSize ?? '16'}
          onChange={(e) =>
            onChange({
              textSize: e.target.value as
                | '12'
                | '16'
                | '20'
                | '24'
                | '32'
                | '40'
                | '48'
                | '56'
                | '64',
            })
          }
          className="w-full mt-0.5 px-2 py-1.5 border border-gray-300 rounded"
        >
          <option value="12">12px</option>
          <option value="16">16px</option>
          <option value="20">20px</option>
          <option value="24">24px</option>
          <option value="32">32px</option>
          <option value="40">40px</option>
          <option value="48">48px</option>
          <option value="56">56px</option>
          <option value="64">64px</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Warna teks</label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="color"
            value={displayHex}
            onChange={(e) => onChange({ textColor: e.target.value })}
            className="h-9 w-14 cursor-pointer rounded border border-gray-300 bg-white p-0.5"
            aria-label="Pilih warna teks"
          />
          <input
            type="text"
            value={displayHex}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (HEX_COLOR_REGEX.test(v) || v === '')
                onChange({ textColor: v || DEFAULT_TEXT_COLOR_HEX });
            }}
            placeholder={DEFAULT_TEXT_COLOR_HEX}
            className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm font-mono"
          />
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>Preset:</span>
            {[
              { label: 'Slate', hex: '#0f172a' },
              { label: 'Biru', hex: '#1956FF' },
              { label: 'Putih', hex: '#ffffff' },
            ].map(({ label, hex }) => (
              <button
                key={hex}
                type="button"
                onClick={() => onChange({ textColor: hex })}
                className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs"
              >
                {label}
              </button>
            ))}
          </span>
        </div>
      </div>
    </>
  );
}
