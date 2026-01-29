'use client';

import type { Vendor, AssetMaster } from '@/app/types/credit-simulation';
import { IconMapPin, IconPhoto } from '@tabler/icons-react';

interface SimulationSidebarProps {
  dealer: Vendor;
  asset: AssetMaster;
  specs: {
    manufacturingYear?: number;
    trimName?: string;
    exteriorColorName?: string;
    interiorColorName?: string;
  };
  onChangeModel: () => void;
}

export function SimulationSidebar({ dealer, asset, specs, onChangeModel }: SimulationSidebarProps) {
  const location = [dealer.City, dealer.VendorName].filter(Boolean).join(', ');

  return (
    <aside className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 lg:p-4 h-fit lg:sticky lg:top-16">
      {/* Location */}
      {location && (
        <div className="flex items-start gap-2 mb-2">
          <IconMapPin className="mt-0.5 shrink-0 text-gray-500" size={18} />
          <span className="text-sm text-gray-700">{location}</span>
        </div>
      )}

      {/* Vehicle image placeholder */}
      <div className="aspect-[4/3] rounded-lg bg-gray-200 flex items-center justify-center mb-2">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <IconPhoto size={40} stroke={1.5} />
          <span className="text-xs">Gambar kendaraan</span>
        </div>
      </div>

      {/* Change Model */}
      <button
        type="button"
        onClick={onChangeModel}
        className="w-full py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 hover:border-gray-400 transition mb-5"
      >
        Ganti Model
      </button>

      {/* Specs */}
      <dl className="space-y-1.5 text-sm">
        <div>
          <dt className="text-gray-500 text-xs font-medium">Model</dt>
          <dd className="text-gray-900 font-semibold mt-0.5">{asset.AssetName || '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500 text-xs font-medium">Tipe</dt>
          <dd className="text-gray-900 font-semibold mt-0.5">{specs.trimName || '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500 text-xs font-medium">Exterior</dt>
          <dd className="text-gray-900 font-semibold mt-0.5">{specs.exteriorColorName || '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500 text-xs font-medium">Interior</dt>
          <dd className="text-gray-900 font-semibold mt-0.5">{specs.interiorColorName || '—'}</dd>
        </div>
        {specs.manufacturingYear && (
          <div>
            <dt className="text-gray-500 text-xs font-medium">Tahun</dt>
            <dd className="text-gray-900 font-semibold mt-0.5">{specs.manufacturingYear}</dd>
          </div>
        )}
      </dl>
    </aside>
  );
}
