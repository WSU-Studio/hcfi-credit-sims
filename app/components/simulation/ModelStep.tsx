'use client';

import { useEffect, useState } from 'react';
import type { AssetMaster } from '@/app/types/credit-simulation';

interface ModelStepProps {
  dealerCode: string;
  onSelect: (asset: AssetMaster) => void;
  selectedAsset?: AssetMaster;
}

export function ModelStep({ dealerCode, onSelect, selectedAsset }: ModelStepProps) {
  const [assets, setAssets] = useState<AssetMaster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch assets');
      }

      if (data.ListAssetMasterObj) {
        setAssets(data.ListAssetMasterObj);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load models');
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Pilih Model Mobil</h2>
        <p className="text-[var(--muted)]">Pilih model kendaraan yang ingin Anda simulasi</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-[var(--muted)]">Memuat model mobil...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-8 text-[var(--muted)]">Tidak ada model tersedia</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <button
              key={asset.AssetCode}
              type="button"
              onClick={() => onSelect(asset)}
              className={`p-6 border-2 rounded-xl text-left transition ${
                selectedAsset?.AssetCode === asset.AssetCode
                  ? 'border-[#008AEC] bg-[#008AEC]/10 shadow-lg'
                  : 'border-[var(--border)] hover:border-[#008AEC]/50 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{asset.AssetName}</div>
                  <div className="text-xs text-[var(--muted)] mt-1 px-2 py-1 bg-[var(--muted)]/20 rounded inline-block">
                    {asset.AssetCategoryName}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <div className="text-sm text-[var(--muted)]">Mulai dari</div>
                <div className="text-xl font-bold text-[#008AEC]">
                  {formatPrice(asset.Price)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
