'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Vendor } from '@/app/types/credit-simulation';
import { ROLE_NAMES } from '@/lib/user-types';

export type DealerAssignValue = {
  vendorCode: string;
  vendorName: string;
  vendorCity: string;
  oriOfficeCode: string;
  oriOfficeName: string;
  cmoEmpNo: string;
};

type DealerAssignFieldsProps = {
  roleNames: string[];
  value: DealerAssignValue;
  onChange: (value: DealerAssignValue) => void;
  disabled?: boolean;
};

function sortDealers(dealers: Vendor[]) {
  return [...dealers].sort((a, b) => a.VendorName.localeCompare(b.VendorName));
}

export function DealerAssignFields({
  roleNames,
  value,
  onChange,
  disabled = false,
}: DealerAssignFieldsProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState(value.vendorCity);

  const needsDealer =
    roleNames.includes(ROLE_NAMES.DEALER_ADMIN) ||
    roleNames.includes(ROLE_NAMES.SALESMAN);

  const isSalesman = roleNames.includes(ROLE_NAMES.SALESMAN);

  useEffect(() => {
    if (!needsDealer) return;

    setLoading(true);
    setError(null);
    fetch('/api/simulation/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hasAvailableAssetOnly: true,
        hasCmoAssignedOnly: true,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ReturnObject) {
          setVendors(data.ReturnObject as Vendor[]);
        }
      })
      .catch(() => setError('Gagal memuat daftar dealer'))
      .finally(() => setLoading(false));
  }, [needsDealer]);

  useEffect(() => {
    if (value.vendorCity) {
      setSelectedCity(value.vendorCity);
    }
  }, [value.vendorCity]);

  const cities = useMemo(
    () => Array.from(new Set(vendors.map((v) => v.City).filter(Boolean))).sort(),
    [vendors]
  );

  const dealersInCity = useMemo(
    () => (selectedCity ? sortDealers(vendors.filter((v) => v.City === selectedCity)) : []),
    [vendors, selectedCity]
  );

  if (!needsDealer) return null;

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    const first = sortDealers(vendors.filter((v) => v.City === city))[0];
    if (first) {
      onChange({
        vendorCode: first.VendorCode,
        vendorName: first.VendorName,
        vendorCity: first.City,
        oriOfficeCode: first.OriOfficeCode,
        oriOfficeName: first.OriOfficeName,
        cmoEmpNo: value.cmoEmpNo,
      });
    } else {
      onChange({
        vendorCode: '',
        vendorName: '',
        vendorCity: city,
        oriOfficeCode: '',
        oriOfficeName: '',
        cmoEmpNo: value.cmoEmpNo,
      });
    }
  };

  const handleDealerSelect = (dealer: Vendor) => {
    onChange({
      vendorCode: dealer.VendorCode,
      vendorName: dealer.VendorName,
      vendorCity: dealer.City,
      oriOfficeCode: dealer.OriOfficeCode,
      oriOfficeName: dealer.OriOfficeName,
      cmoEmpNo: value.cmoEmpNo,
    });
  };

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Penugasan Dealer / Cabang</h3>
        <p className="mt-1 text-xs text-gray-500">
          Wajib untuk role Dealer Admin dan Salesman. Sales akan otomatis terikat ke dealer ini.
        </p>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dealer-city" className="block text-sm font-medium text-gray-700 mb-1">
            Kota <span className="text-red-500">*</span>
          </label>
          <select
            id="dealer-city"
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={disabled || loading}
            className="w-full px-3 h-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC] disabled:opacity-60"
          >
            <option value="">{loading ? 'Memuat...' : 'Pilih kota'}</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dealer-select" className="block text-sm font-medium text-gray-700 mb-1">
            Dealer <span className="text-red-500">*</span>
          </label>
          <select
            id="dealer-select"
            value={value.vendorCode}
            onChange={(e) => {
              const dealer = dealersInCity.find((d) => d.VendorCode === e.target.value);
              if (dealer) handleDealerSelect(dealer);
            }}
            disabled={disabled || loading || !selectedCity}
            className="w-full px-3 h-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC] disabled:opacity-60"
          >
            <option value="">Pilih dealer</option>
            {dealersInCity.map((dealer) => (
              <option key={dealer.VendorCode} value={dealer.VendorCode}>
                {dealer.VendorName}
                {dealer.OriOfficeName ? ` · ${dealer.OriOfficeName}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {value.oriOfficeName && (
        <p className="text-xs text-gray-600">
          Cabang: <span className="font-medium">{value.oriOfficeName}</span>
          {value.oriOfficeCode ? ` (${value.oriOfficeCode})` : ''}
        </p>
      )}

      {isSalesman && (
        <div>
          <label htmlFor="cmoEmpNo" className="block text-sm font-medium text-gray-700 mb-1">
            CMO Employee No <span className="text-gray-400 font-normal">(opsional)</span>
          </label>
          <input
            id="cmoEmpNo"
            type="text"
            value={value.cmoEmpNo}
            onChange={(e) => onChange({ ...value, cmoEmpNo: e.target.value })}
            disabled={disabled}
            placeholder="Nomor karyawan CMO"
            className="w-full px-3 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC] disabled:opacity-60"
          />
        </div>
      )}
    </div>
  );
}
