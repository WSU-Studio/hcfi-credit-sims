'use client';

import { useTranslations } from 'next-intl';
import type { Vendor, AssetMaster } from '@/app/types/credit-simulation';
import { IconMapPin } from '@tabler/icons-react';
import { VehicleImage } from '@/app/components/simulation/VehicleImage';

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
  const t = useTranslations('creditSimulation');
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

      <VehicleImage
        assetCode={asset.AssetCode}
        fullAssetCode={asset.FullAssetCode}
        assetName={asset.AssetName}
      />

      {/* Change Model */}
      <button
        type="button"
        onClick={onChangeModel}
        className="w-full py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 hover:border-gray-400 transition mb-5"
      >
        {t('changeModel')}
      </button>

      {/* Specs */}
      <dl className="space-y-1.5 text-sm">
        <div>
          <dt className="text-gray-500 text-xs font-medium">{t('stepModel')}</dt>
          <dd className="text-gray-900 font-semibold mt-0.5">{asset.AssetName || '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500 text-xs font-medium">{t('sidebarTypeLabel')}</dt>
          <dd className="text-gray-900 font-semibold mt-0.5">{specs.trimName || '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500 text-xs font-medium">{t('sidebarExteriorLabel')}</dt>
          <dd className="text-gray-900 font-semibold mt-0.5">{specs.exteriorColorName || '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500 text-xs font-medium">{t('sidebarInteriorLabel')}</dt>
          <dd className="text-gray-900 font-semibold mt-0.5">{specs.interiorColorName || '—'}</dd>
        </div>
        {specs.manufacturingYear && (
          <div>
            <dt className="text-gray-500 text-xs font-medium">{t('sidebarYearLabel')}</dt>
            <dd className="text-gray-900 font-semibold mt-0.5">{specs.manufacturingYear}</dd>
          </div>
        )}
      </dl>
    </aside>
  );
}
