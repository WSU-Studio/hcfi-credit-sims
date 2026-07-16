'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { AssetMaster } from '@/app/types/credit-simulation';

const CATEGORY_KEYS = ['ALL', 'SUV', 'EV', 'MPV'] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];

interface ModelStepProps {
  dealerCode: string;
  onSelect: (asset: AssetMaster) => void;
  selectedAsset?: AssetMaster;
}

export function ModelStep({ dealerCode, onSelect, selectedAsset }: ModelStepProps) {
  const t = useTranslations('creditSimulation');
  const [assets, setAssets] = useState<AssetMaster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('ALL');

  useEffect(() => {
    if (dealerCode) {
      fetchAssets();
    }
  }, [dealerCode]);

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/simulation/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          DealerCode: dealerCode,
          GetLatestAsset: true,
          GlobalCatalog: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch assets');
      }

      if (data.ListAssetMasterObj) {
        setAssets(data.ListAssetMasterObj);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('errorLoadModels');
      setError(message);
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = useMemo(() => {
    if (activeCategory === 'ALL') return assets;
    return assets.filter((a) => a.AssetCategoryName === activeCategory);
  }, [assets, activeCategory]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6 text-gray-900">
      <div>
        <h2 className="text-2xl font-semibold mb-2">{t('modelStepTitle')}</h2>
        <p className="text-[var(--muted)]">
          {t('modelStepDescription')}
        </p>
      </div>

      {error && (
        <div
          className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-[var(--muted)]">
          {t('loadingModels')}
        </div>
      ) : assets.length === 0 ? (
        <div className="py-12 text-center text-[var(--muted)]">
          {t('noModelsForDealer')}
        </div>
      ) : (
        <>
          {/* Category filter tabs */}
          <div
            className="flex flex-wrap gap-2 p-1 rounded-xl bg-[var(--muted)]/10 border border-[var(--border)]"
            role="tablist"
            aria-label={t('filterVehicleType')}
          >
            {CATEGORY_KEYS.map((categoryKey) => {
              const count =
                categoryKey === 'ALL'
                  ? assets.length
                  : assets.filter((a) => a.AssetCategoryName === categoryKey).length;
              const isActive = activeCategory === categoryKey;
              const label = categoryKey === 'ALL' ? t('categoryAll') : categoryKey;

              return (
                <button
                  key={categoryKey}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${categoryKey}`}
                  id={`tab-${categoryKey}`}
                  onClick={() => setActiveCategory(categoryKey)}
                  className={`min-w-[5rem] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#002c5f] text-white shadow-sm'
                      : 'text-[var(--muted)] hover:bg-[var(--muted)]/20 hover:text-[var(--foreground)]'
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span
                      className={`ml-1.5 ${isActive ? 'text-white/80' : 'text-[var(--muted)]'}`}
                    >
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Model grid */}
          <div
            id="panel-model-grid"
            role="tabpanel"
            aria-labelledby={`tab-${activeCategory}`}
            className="focus:outline-none"
          >
            {filteredAssets.length === 0 ? (
              <div className="py-12 text-center text-[var(--muted)]">
                {t('noModelsInCategory')}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?.AssetCode === asset.AssetCode;

                  return (
                    <button
                      key={asset.AssetCode}
                      type="button"
                      onClick={() => onSelect(asset)}
                      className={`group relative p-6 text-left rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-[#002c5f] bg-[#002c5f]/10 shadow-lg ring-2 ring-[#002c5f]/30'
                          : 'border-[var(--border)] hover:border-[#002c5f]/50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-lg truncate">
                            {asset.AssetName}
                          </div>
                          <span
                            className={`inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-md ${
                              asset.AssetCategoryName === 'EV'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                : asset.AssetCategoryName === 'MPV'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                  : 'bg-[#002c5f]/15 text-[#002c5f]'
                            }`}
                          >
                            {asset.AssetCategoryName}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#002c5f] text-white text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="pt-4 border-t border-[var(--border)]">
                        {asset.Price > 0 ? (
                          <>
                            <div className="text-xs text-[var(--muted)] uppercase tracking-wide">
                              {t('startingFrom')}
                            </div>
                            <div className="mt-1 text-xl font-bold text-[#002c5f]">
                              {formatPrice(asset.Price)}
                            </div>
                          </>
                        ) : (
                          <div className="mt-1 text-sm font-medium text-[var(--muted)]">
                            {t('priceAvailableOnType')}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
