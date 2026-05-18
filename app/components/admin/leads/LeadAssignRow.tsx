'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Vendor } from '@/app/types/credit-simulation';
import type { HyundaiKeyValue } from '@/lib/hyundai-lead-integration';

type LeadAssignState = {
  vendorCode: string;
  cmoEmpNo: string;
  cmoName: string;
};

export type LeadForAssign = {
  id: string;
  vendorCode?: string | null;
  vendorName?: string | null;
  cmoEmpNo?: string | null;
  cmoName?: string | null;
  hyundaiLeadNo?: string | null;
  hyundaiAssignStatus?: string | null;
  hyundaiAssignError?: string | null;
};

interface LeadAssignRowProps {
  lead: LeadForAssign;
  vendors: Vendor[];
  vendorsLoading: boolean;
  canSubmit: boolean;
  onSubmitted: () => void;
}

const selectClass =
  'w-full min-w-[9rem] px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed';

export function LeadAssignRow({
  lead,
  vendors,
  vendorsLoading,
  canSubmit,
  onSubmitted,
}: LeadAssignRowProps) {
  const isSubmitted = lead.hyundaiAssignStatus === 'SUBMITTED' && !!lead.hyundaiLeadNo;

  const [selection, setSelection] = useState<LeadAssignState>({
    vendorCode: lead.vendorCode ?? '',
    cmoEmpNo: lead.cmoEmpNo ?? '',
    cmoName: lead.cmoName ?? '',
  });
  const [salesPersons, setSalesPersons] = useState<HyundaiKeyValue[]>([]);
  const [cmoLoading, setCmoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(lead.hyundaiAssignError);

  const cities = useMemo(
    () => Array.from(new Set(vendors.map((v) => v.City).filter(Boolean))).sort(),
    [vendors]
  );

  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    if (lead.vendorCode && vendors.length > 0) {
      const vendor = vendors.find((v) => v.VendorCode === lead.vendorCode);
      if (vendor?.City) setSelectedCity(vendor.City);
    }
  }, [lead.vendorCode, vendors]);

  const dealersInCity = useMemo(() => {
    if (!selectedCity) return [];
    return vendors
      .filter((v) => v.City === selectedCity)
      .sort((a, b) => a.VendorName.localeCompare(b.VendorName));
  }, [vendors, selectedCity]);

  useEffect(() => {
    if (!selection.vendorCode || isSubmitted) {
      setSalesPersons([]);
      return;
    }

    let cancelled = false;
    setCmoLoading(true);
    fetch(`/api/admin/leads/sales-persons?vendorCode=${encodeURIComponent(selection.vendorCode)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        const list: HyundaiKeyValue[] = data.salesPersons ?? [];
        setSalesPersons(list);
        if (!selection.cmoEmpNo && list.length > 0) {
          setSelection((prev) => ({
            ...prev,
            cmoEmpNo: list[0].Key,
            cmoName: list[0].Value,
          }));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSalesPersons([]);
          setError(err instanceof Error ? err.message : 'Gagal memuat CMO');
        }
      })
      .finally(() => {
        if (!cancelled) setCmoLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.vendorCode, isSubmitted]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    const inCity = vendors.filter((v) => v.City === city);
    const first = inCity[0];
    setSelection({ vendorCode: first?.VendorCode ?? '', cmoEmpNo: '', cmoName: '' });
    setError(null);
  };

  const handleDealerChange = (vendorCode: string) => {
    const vendor = vendors.find((v) => v.VendorCode === vendorCode);
    setSelection({ vendorCode, cmoEmpNo: '', cmoName: '' });
    if (vendor?.City) setSelectedCity(vendor.City);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selection.vendorCode || !selection.cmoEmpNo) {
      setError('Pilih dealer dan CMO terlebih dahulu');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorCode: selection.vendorCode,
          cmoEmpNo: selection.cmoEmpNo,
          cmoName: selection.cmoName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal submit ke Hyundai');
      onSubmitted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <td className="px-3 py-2 align-top text-xs text-gray-700">
          {lead.vendorName || lead.vendorCode || '-'}
        </td>
        <td className="px-3 py-2 align-top text-xs text-gray-700">
          {lead.cmoName || lead.cmoEmpNo || '-'}
        </td>
        <td className="px-3 py-2 align-top">
          <p className="text-xs font-medium text-green-700">Terkirim</p>
          <p className="text-[10px] text-gray-600 break-all mt-0.5">{lead.hyundaiLeadNo}</p>
        </td>
      </>
    );
  }

  return (
    <>
      <td className="px-3 py-2 align-top">
        <div className="space-y-1.5">
          {vendorsLoading ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={!canSubmit || submitting}
                className={selectClass}
                aria-label="Pilih kota"
              >
                <option value="">Kota</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <select
                value={selection.vendorCode}
                onChange={(e) => handleDealerChange(e.target.value)}
                disabled={!canSubmit || submitting || !selectedCity}
                className={selectClass}
                aria-label="Pilih dealer"
              >
                <option value="">Dealer</option>
                {dealersInCity.map((v) => (
                  <option key={v.VendorCode} value={v.VendorCode}>
                    {v.VendorName}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </td>
      <td className="px-3 py-2 align-top">
        <select
          value={selection.cmoEmpNo}
          onChange={(e) => {
            const sp = salesPersons.find((s) => s.Key === e.target.value);
            setSelection({
              ...selection,
              cmoEmpNo: e.target.value,
              cmoName: sp?.Value ?? '',
            });
          }}
          disabled={!canSubmit || submitting || !selection.vendorCode || cmoLoading}
          className={selectClass}
          aria-label="Pilih CMO"
        >
          <option value="">{cmoLoading ? 'Memuat CMO...' : 'CMO'}</option>
          {salesPersons.map((sp) => (
            <option key={sp.Key} value={sp.Key}>
              {sp.Value}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2 align-top">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting || !selection.vendorCode || !selection.cmoEmpNo}
          className="w-full min-w-[5rem] px-2 py-1.5 bg-[#002c5f] text-white rounded-lg text-xs font-semibold hover:bg-[#002c5f]/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? '...' : 'SUBMIT'}
        </button>
        {error && <p className="text-[10px] text-red-600 mt-1 leading-tight">{error}</p>}
      </td>
    </>
  );
}
