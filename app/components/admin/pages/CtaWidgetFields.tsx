'use client';

import { IconPlus, IconTrash } from '@tabler/icons-react';
import type { CtaButtonItem, CtaWidgetPayload } from '@/app/types';
import { generateId } from '@/lib/layout-builder-utils';

const MAX_BUTTONS = 6;

type CtaWidgetFieldsProps = {
  value: Partial<CtaWidgetPayload>;
  onChange: (payload: Partial<CtaWidgetPayload>) => void;
};

function createEmptyButton(): CtaButtonItem {
  return {
    id: generateId(),
    label: '',
    labelEn: '',
    url: '',
    openInNewTab: false,
  };
}

export function CtaWidgetFields({ value, onChange }: CtaWidgetFieldsProps) {
  const buttons = value.buttons ?? [];

  const updateButtons = (nextButtons: CtaButtonItem[]) => {
    onChange({ buttons: nextButtons });
  };

  const updateButton = (index: number, patch: Partial<CtaButtonItem>) => {
    const nextButtons = buttons.map((button, i) =>
      i === index ? { ...button, ...patch } : button
    );
    updateButtons(nextButtons);
  };

  const addButton = () => {
    if (buttons.length >= MAX_BUTTONS) return;
    updateButtons([...buttons, createEmptyButton()]);
  };

  const removeButton = (index: number) => {
    updateButtons(buttons.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-600">Tombol CTA</p>
          <button
            type="button"
            onClick={addButton}
            disabled={buttons.length >= MAX_BUTTONS}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconPlus size={14} />
            Tambah tombol
          </button>
        </div>

        {buttons.length === 0 && (
          <p className="text-xs text-gray-500">Belum ada tombol. Klik &quot;Tambah tombol&quot; untuk menambahkan.</p>
        )}

        {buttons.map((button, index) => (
          <div key={button.id} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Tombol {index + 1}</span>
              <button
                type="button"
                onClick={() => removeButton(index)}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
              >
                <IconTrash size={14} />
                Hapus
              </button>
            </div>
            <input
              type="text"
              value={button.label}
              onChange={(e) => updateButton(index, { label: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-t-lg border-b-0"
              placeholder="Label (ID)"
            />
            <input
              type="text"
              value={button.labelEn ?? ''}
              onChange={(e) => updateButton(index, { labelEn: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-b-lg"
              placeholder="Label (EN)"
            />
            <input
              type="text"
              value={button.url}
              onChange={(e) => updateButton(index, { url: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg"
              placeholder="URL (/halaman atau https://...)"
            />
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={button.openInNewTab === true}
                onChange={(e) => updateButton(index, { openInNewTab: e.target.checked })}
                className="rounded border-gray-300"
              />
              Buka di tab baru
            </label>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-gray-200 pt-3">
        <p className="text-xs font-medium text-gray-600">Pengaturan tampilan</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Perataan</label>
            <select
              value={value.align ?? 'left'}
              onChange={(e) =>
                onChange({ align: e.target.value as CtaWidgetPayload['align'] })
              }
              className="w-full px-2 py-1.5 border border-gray-300 rounded"
            >
              <option value="left">Kiri</option>
              <option value="center">Tengah</option>
              <option value="right">Kanan</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Arah</label>
            <select
              value={value.direction ?? 'row'}
              onChange={(e) =>
                onChange({ direction: e.target.value as CtaWidgetPayload['direction'] })
              }
              className="w-full px-2 py-1.5 border border-gray-300 rounded"
            >
              <option value="row">Horizontal</option>
              <option value="column">Vertikal</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Varian</label>
            <select
              value={value.variant ?? 'primary'}
              onChange={(e) =>
                onChange({ variant: e.target.value as CtaWidgetPayload['variant'] })
              }
              className="w-full px-2 py-1.5 border border-gray-300 rounded"
            >
              <option value="primary">Primary (biru)</option>
              <option value="secondary">Secondary (cyan)</option>
              <option value="outline">Outline</option>
              <option value="ghost">Ghost</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Ukuran</label>
            <select
              value={value.size ?? 'md'}
              onChange={(e) =>
                onChange({ size: e.target.value as CtaWidgetPayload['size'] })
              }
              className="w-full px-2 py-1.5 border border-gray-300 rounded"
            >
              <option value="sm">Kecil</option>
              <option value="md">Sedang</option>
              <option value="lg">Besar</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Jarak antar tombol</label>
            <select
              value={value.gap ?? 'md'}
              onChange={(e) =>
                onChange({ gap: e.target.value as CtaWidgetPayload['gap'] })
              }
              className="w-full px-2 py-1.5 border border-gray-300 rounded"
            >
              <option value="sm">Rapat</option>
              <option value="md">Sedang</option>
              <option value="lg">Longgar</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={value.fullWidth === true}
                onChange={(e) => onChange({ fullWidth: e.target.checked })}
                className="rounded border-gray-300"
              />
              Tombol full width
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
