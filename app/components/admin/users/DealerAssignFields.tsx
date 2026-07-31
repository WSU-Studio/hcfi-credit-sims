'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Vendor } from '@/app/types/credit-simulation';
import {
  fetchSimulationJson,
  isAbortError,
} from '@/lib/simulation-client-fetch';
import { ROLE_NAMES } from '@/lib/user-types';

export type DealerAssignValue = {
  vendorCode: string;
  vendorName: string;
  vendorCity: string;
  oriOfficeCode: string;
  oriOfficeName: string;
  /** Emp number CMO (HCFI) — opsional, diisi manual. Sumber berbeda dari salesEmpNo. */
  cmoEmpNo: string;
  /** Emp number salesman dealer — dipilih dari API Get List Sales Person. */
  salesEmpNo: string;
};

type DealerAssignFieldsProps = {
  roleNames: string[];
  value: DealerAssignValue;
  onChange: (value: DealerAssignValue) => void;
  /** Dipanggil saat Emp Number dipilih dari dropdown — membawa nama sales person dari API. */
  onSalesPersonSelect?: (name: string) => void;
  disabled?: boolean;
};

function sortDealers(dealers: Vendor[]) {
  return [...dealers].sort((a, b) => a.VendorName.localeCompare(b.VendorName));
}

/** API vendors bisa mengembalikan VendorCode yang sama berkali-kali (beda row office). */
function uniqueDealersByCode(dealers: Vendor[]) {
  return Array.from(new Map(dealers.map((v) => [v.VendorCode, v])).values());
}

type SalesPersonOption = { Key: string; Value: string };

export function DealerAssignFields({
  roleNames,
  value,
  onChange,
  onSalesPersonSelect,
  disabled = false,
}: DealerAssignFieldsProps) {
  // null = belum selesai fetch; loading diturunkan dari state ini (bukan setState di effect).
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [salesPersons, setSalesPersons] = useState<SalesPersonOption[]>([]);
  const [salesPersonsLoading, setSalesPersonsLoading] = useState(false);

  const needsDealer =
    roleNames.includes(ROLE_NAMES.DEALER_ADMIN) ||
    roleNames.includes(ROLE_NAMES.SALESMAN);

  const isSalesman = roleNames.includes(ROLE_NAMES.SALESMAN);
  const selectedCity = value.vendorCity;
  const loading = needsDealer && vendors === null && error === null;

  useEffect(() => {
    if (!needsDealer) return;

    const controller = new AbortController();
    let active = true;

    async function loadVendors() {
      try {
        const data = await fetchSimulationJson<{ ReturnObject?: Vendor[] }>({
          url: '/api/simulation/vendors',
          body: {
            hasAvailableAssetOnly: true,
            hasCmoAssignedOnly: false,
          },
          signal: controller.signal,
        });
        if (!active) return;
        setVendors(
          Array.isArray(data.ReturnObject) ? data.ReturnObject : []
        );
      } catch (err: unknown) {
        if (!active || isAbortError(err)) return;
        setError('Gagal memuat daftar dealer');
        setVendors([]);
      }
    }

    void loadVendors();

    return () => {
      active = false;
      controller.abort();
    };
  }, [needsDealer]);

  const dealersInCity = useMemo(
    () =>
      selectedCity
        ? sortDealers(
            uniqueDealersByCode((vendors ?? []).filter((v) => v.City === selectedCity))
          )
        : [],
    [vendors, selectedCity]
  );

  /** Dealer benar-benar terpilih: vendorCode ada DAN masih valid untuk kota yang dipilih. */
  const dealerSelected =
    Boolean(value.vendorCode) &&
    dealersInCity.some((d) => d.VendorCode === value.vendorCode);

  // Daftar Emp Number per vendor (Hyundai: Get List Sales Person).
  useEffect(() => {
    if (!isSalesman || !dealerSelected) {
      setSalesPersons([]);
      return;
    }

    let active = true;
    setSalesPersonsLoading(true);

    fetch(`/api/admin/users/sales-persons?vendorCode=${encodeURIComponent(value.vendorCode)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.error) throw new Error(data.error);
        setSalesPersons(Array.isArray(data.salesPersons) ? data.salesPersons : []);
      })
      .catch(() => {
        if (active) setSalesPersons([]);
      })
      .finally(() => {
        if (active) setSalesPersonsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isSalesman, dealerSelected, value.vendorCode]);

  const cities = useMemo(
    () =>
      Array.from(new Set((vendors ?? []).map((v) => v.City).filter(Boolean))).sort(),
    [vendors]
  );

  if (!needsDealer) return null;

  // Ganti kota: dealer harus dipilih ulang secara eksplisit, dan emp number
  // salesman ikut di-reset karena berlaku per vendor.
  const handleCityChange = (city: string) => {
    onChange({
      vendorCode: '',
      vendorName: '',
      vendorCity: city,
      oriOfficeCode: '',
      oriOfficeName: '',
      cmoEmpNo: value.cmoEmpNo,
      salesEmpNo: '',
    });
  };

  const handleDealerSelect = (dealer: Vendor) => {
    onChange({
      vendorCode: dealer.VendorCode,
      vendorName: dealer.VendorName,
      vendorCity: dealer.City,
      oriOfficeCode: dealer.OriOfficeCode,
      oriOfficeName: dealer.OriOfficeName,
      cmoEmpNo: value.cmoEmpNo,
      // Dealer berubah → emp number salesman dealer lama tidak berlaku lagi.
      salesEmpNo: dealer.VendorCode === value.vendorCode ? value.salesEmpNo : '',
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="cmoEmpSelect"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Emp Number <span className="text-red-500">*</span>{' '}
              <span className="text-gray-400 font-normal">(dari dealer)</span>
            </label>
            <select
              id="cmoEmpSelect"
              value={
                salesPersons.some((sp) => sp.Key === value.salesEmpNo)
                  ? value.salesEmpNo
                  : ''
              }
              onChange={(e) => {
                onChange({ ...value, salesEmpNo: e.target.value });
                const sp = salesPersons.find((s) => s.Key === e.target.value);
                if (sp?.Value) onSalesPersonSelect?.(sp.Value);
              }}
              disabled={disabled || salesPersonsLoading || !dealerSelected}
              className="w-full px-3 h-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC] disabled:opacity-60"
            >
              <option value="">
                {!dealerSelected
                  ? 'Pilih dealer dulu'
                  : salesPersonsLoading
                    ? 'Memuat...'
                    : salesPersons.length === 0
                      ? 'Tidak ada sales person'
                      : 'Pilih emp number'}
              </option>
              {salesPersons.map((sp) => (
                <option key={sp.Key} value={sp.Key}>
                  {sp.Value} ({sp.Key})
                </option>
              ))}
            </select>
          </div>

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
            <p className="mt-1 text-xs text-gray-500">
              Nomor CMO (HCFI) — berbeda dari Emp Number salesman. Jika diisi,
              CMO di halaman leads terkunci ke nomor ini.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
