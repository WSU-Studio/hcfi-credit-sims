'use client';

import { useEffect, useState } from 'react';
import type { Vendor } from '@/app/types/credit-simulation';

interface DealerStepProps {
  onSelect: (dealer: Vendor) => void;
  selectedDealer?: Vendor;
}

export function DealerStep({ onSelect, selectedDealer }: DealerStepProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');

  useEffect(() => {
    fetchVendors();
  }, []);

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
    } catch (err: any) {
      setError(err.message || 'Failed to load vendors');
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const cities = Array.from(new Set(vendors.map(v => v.City))).sort();
  const filteredVendors = selectedCity
    ? vendors.filter(v => v.City === selectedCity)
    : vendors;

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
        {/* City Filter */}
        {cities.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Filter by Kota
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:ring-2 focus:ring-[#008AEC] focus:border-transparent"
            >
              <option value="">Semua Kota</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        )}

        {/* Vendor List */}
        {loading ? (
          <div className="text-center py-8 text-[var(--muted)]">Memuat dealer...</div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted)]">Tidak ada dealer tersedia</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredVendors.map((vendor) => (
              <button
                key={vendor.VendorCode}
                type="button"
                onClick={() => onSelect(vendor)}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  selectedDealer?.VendorCode === vendor.VendorCode
                    ? 'border-[#008AEC] bg-[#008AEC]/10'
                    : 'border-[var(--border)] hover:border-[#008AEC]/50'
                }`}
              >
                <div className="font-semibold">{vendor.VendorName}</div>
                <div className="text-sm text-[var(--muted)] mt-1">
                  {vendor.City} • {vendor.ZipCode}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
