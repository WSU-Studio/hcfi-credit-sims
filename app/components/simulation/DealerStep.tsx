'use client';

import { useEffect, useState } from 'react';
import type { Vendor } from '@/app/types/credit-simulation';

interface DealerStepProps {
  onSelect: (dealer: Vendor) => void;
  selectedDealer?: Vendor | null;
}

export function DealerStep({ onSelect, selectedDealer }: DealerStepProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>(selectedDealer?.City ?? '');

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedDealer?.City) {
      setSelectedCity(selectedDealer.City);
    }
  }, [selectedDealer?.City]);

  const handleCityClick = (city: string) => {
    setSelectedCity(city);
    const filtered = vendors.filter(v => v.City === city);
    if (filtered.length > 0) {
      onSelect(filtered[0]);
    }
  };

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/simulation/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasAvailableAssetOnly: true,
          hasCmoAssignedOnly: true,
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

  const cities = Array.from(new Set(vendors.map(v => v.City))).sort();

  return (
    <div className="space-y-6 text-gray-900">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Pilih Dealer</h2>
        <p className="text-[var(--muted)]">Pilih kota dan dealer untuk melanjutkan simulasi</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Pilihan kota dengan button - lebih mudah terlihat */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Pilih Kota <span className="text-red-500">*</span>
          </label>
          {loading ? (
            <div className="flex flex-wrap gap-3 py-4">
              <div className="h-10 w-24 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-10 w-28 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-10 w-20 rounded-lg bg-gray-200 animate-pulse" />
              <p className="w-full mt-2 text-sm text-[var(--muted)]">
                Mengambil daftar dealer...
              </p>
            </div>
          ) : cities.length === 0 ? (
            <p className="py-4 text-[var(--muted)]">Tidak ada kota tersedia</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleCityClick(city)}
                  className={`px-5 py-3 rounded-lg border-2 font-medium transition-colors cursor-pointer ${
                    selectedCity === city
                      ? 'border-[#002c5f] bg-[#002c5f] text-white ring-2 ring-[#002c5f]/40 ring-offset-2'
                      : 'border-[var(--border)] hover:border-[#002c5f]/50 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
          {/* {!loading && selectedCity && (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Dealer pertama di {selectedCity} akan dipilih secara otomatis
            </p>
          )} */}
        </div>
      </div>
    </div>
  );
}
