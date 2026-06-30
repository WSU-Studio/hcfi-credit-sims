'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Vendor } from '@/app/types/credit-simulation';

interface DealerStepProps {
  onContinue: (dealer: Vendor) => void;
  selectedDealer?: Vendor | null;
}

function sortDealers(dealers: Vendor[]) {
  return [...dealers].sort((a, b) => a.VendorName.localeCompare(b.VendorName));
}

export function DealerStep({ onContinue, selectedDealer }: DealerStepProps) {
  const t = useTranslations('creditSimulation');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>(selectedDealer?.City ?? '');
  const [localDealer, setLocalDealer] = useState<Vendor | null>(selectedDealer ?? null);

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedDealer) {
      setSelectedCity(selectedDealer.City);
      setLocalDealer(selectedDealer);
    }
  }, [selectedDealer]);

  const cities = useMemo(
    () => Array.from(new Set(vendors.map((v) => v.City).filter(Boolean))).sort(),
    [vendors]
  );

  const dealersInCity = useMemo(
    () => (selectedCity ? sortDealers(vendors.filter((v) => v.City === selectedCity)) : []),
    [vendors, selectedCity]
  );

  const handleCityChange = (city: string) => {
    if (!city || city === selectedCity) return;
    setSelectedCity(city);
    const inCity = sortDealers(vendors.filter((v) => v.City === city));
    setLocalDealer(inCity[0] ?? null);
  };

  const handleDealerClick = (dealer: Vendor) => {
    setLocalDealer(dealer);
  };

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/simulation/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Asset: dealer harus punya stok unit untuk simulasi.
          // CMO: false agar semua kota/dealer tampil (CMO dipilih saat admin assign lead).
          hasAvailableAssetOnly: true,
          hasCmoAssignedOnly: false,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch vendors');
      }

      if (data.ReturnObject) {
        setVendors(data.ReturnObject);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors');
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-gray-900">
      <div>
        <h2 className="text-2xl font-semibold mb-2">{t('dealerStepTitle')}</h2>
        <p className="text-[var(--muted)]">{t('dealerStepDescription')}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-8">
        <div>
          <label htmlFor="dealer-city" className="block text-sm font-medium mb-2">
            {t('selectCity')} <span className="text-red-500">*</span>
          </label>
          {loading ? (
            <div className="h-11 rounded-lg bg-gray-200 animate-pulse" aria-hidden />
          ) : cities.length === 0 ? (
            <p className="py-4 text-[var(--muted)]">{t('noCities')}</p>
          ) : (
            <select
              id="dealer-city"
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] transition cursor-pointer"
            >
              <option value="">{t('selectCityPlaceholder')}</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            // {cities.map((city) => (
            //   <button
            //     key={city}
            //     type="button"
            //     onClick={() => handleCityClick(city)}
            //     className={`px-5 py-3 rounded-lg border-2 font-medium transition-colors cursor-pointer ${
            //       selectedCity === city
            //         ? 'border-[#002c5f] bg-[#002c5f] text-white ring-2 ring-[#002c5f]/40 ring-offset-2'
            //         : 'border-[var(--border)] hover:border-[#002c5f]/50 hover:bg-gray-50 text-gray-700'
            //     }`}
            //   >
            //     {city}
            //   </button>
            // ))}
          )}
          {loading && (
            <p className="mt-1.5 text-sm text-[var(--muted)]">{t('loadingDealers')}</p>
          )}
        </div>

        {selectedCity && !loading && (
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('selectDealer')} <span className="text-red-500">*</span>
            </label>
            {localDealer && (
              <p className="mb-3 text-sm text-[var(--muted)]">{t('dealerAutoSelectedHint')}</p>
            )}
            {dealersInCity.length === 0 ? (
              <p className="py-4 text-[var(--muted)]">{t('noDealersInCity')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[min(24rem,50vh)] overflow-y-auto pr-1">
                {dealersInCity.map((dealer) => {
                  const isSelected = localDealer?.VendorCode === dealer.VendorCode;

                  return (
                    <button
                      key={dealer.VendorCode}
                      type="button"
                      onClick={() => handleDealerClick(dealer)}
                      className={`text-left px-4 py-3 rounded-lg border-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-[#002c5f] bg-[#002c5f]/5 ring-2 ring-[#002c5f]/30'
                          : 'border-[var(--border)] hover:border-[#002c5f]/50 hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{dealer.VendorName}</p>
                      {dealer.ZipCode && (
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {dealer.ZipCode}
                          {dealer.OriOfficeName ? ` · ${dealer.OriOfficeName}` : ''}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!selectedCity && !loading && cities.length > 0 && (
          <p className="text-sm text-[var(--muted)]">{t('selectCityFirst')}</p>
        )}

        {localDealer && !loading && (
          <button
            type="button"
            onClick={() => onContinue(localDealer)}
            className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer transition-colors duration-300"
          >
            {t('continueToModel')}
          </button>
        )}
      </div>
    </div>
  );
}
