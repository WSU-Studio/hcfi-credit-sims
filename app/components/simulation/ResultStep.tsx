'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ProductCalculation, Vendor } from '@/app/types/credit-simulation';
import type { LeadAssetSnapshot } from '@/lib/lead-asset-snapshot';
import { IconBrandWhatsapp, IconFileDescription, IconSend } from '@tabler/icons-react';
import {
  SimulationSummaryModal,
  type VehicleSummaryInfo,
} from '@/app/components/simulation/SimulationSummaryModal';
import { ContactModal, type UserLocation } from '@/app/components/simulation/ContactModal';
import { SimulationRetryError } from '@/app/components/simulation/SimulationRetryError';

type TabKind = 'Standard' | 'Promotion';
type FirstInstallment = 'ADDM' | 'ADDB';

interface ResultStepProps {
  leadNo?: string;
  otrPrice?: number;
  discount?: number;
  vehicle?: VehicleSummaryInfo;
  assetSnapshot?: LeadAssetSnapshot | null;
  dealer?: Vendor | null;
  userLocation?: UserLocation;
  onSelectProduct?: (product: ProductCalculation) => void;
}

export function ResultStep({ leadNo, otrPrice, discount = 0, vehicle, assetSnapshot, dealer, userLocation, onSelectProduct }: ResultStepProps) {
  const t = useTranslations('creditSimulation');
  const [tab, setTab] = useState<TabKind>('Standard');
  const [listStandard, setListStandard] = useState<ProductCalculation[]>([]);
  const [listPromo, setListPromo] = useState<ProductCalculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<ProductCalculation | null>(null);
  const [dpPercent, setDpPercent] = useState<number>(10);
  const [firstInstallment, setFirstInstallment] = useState<FirstInstallment>('ADDM');
  const [selectedTenor, setSelectedTenor] = useState<number>(36);

  const [tableRows, setTableRows] = useState<ProductCalculation[]>([]);
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [simulateError, setSimulateError] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [listErrorId, setListErrorId] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [whatsappLeadPhone, setWhatsappLeadPhone] = useState<string>('');
  const fetchListGeneration = useRef(0);

  const products = tab === 'Standard' ? listStandard : listPromo;

  useEffect(() => {
    fetch('/api/public/site-settings')
      .then((res) => res.json())
      .then((data) => {
        const lead = (data.whatsappLeadPhone ?? '').trim();
        const fab = (data.whatsappFabPhone ?? '').trim();
        let digits = (lead || fab || '628111500708').replace(/\D/g, '');
        if (digits.startsWith('0')) digits = '62' + digits.slice(1);
        else if (!digits.startsWith('62')) digits = '62' + digits;
        setWhatsappLeadPhone(digits || '628111500708');
      })
      .catch(() => setWhatsappLeadPhone('628111500708'));
  }, []);

  useEffect(() => {
    if (!otrPrice && !leadNo) return;
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otrPrice, leadNo]);

  useEffect(() => {
    if (selectedProduct) setDpPercent(selectedProduct.DPPrcnt);
  }, [selectedProduct]);

  // Auto-calculate ketika firstInstallment, selectedProduct, atau dpPercent berubah
  // Hanya trigger jika semua data sudah lengkap dan tidak sedang loading
  useEffect(() => {
    if (selectedProduct && otrPrice && dpPercent > 0 && selectedProduct.ProductCode && !simulateLoading) {
      // Delay sedikit untuk menghindari multiple calls saat initial load
      const timer = setTimeout(() => {
        handleCalculate();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstInstallment, selectedProduct?.ProductCode, selectedProduct?.ProductName, dpPercent]);

  const fetchList = async () => {
    const generation = ++fetchListGeneration.current;
    setLoading(true);
    setError(null);
    setListErrorId(null);
    try {
      const res = await fetch('/api/simulation/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadNo, LeadNo: leadNo, otrPrice: otrPrice ?? 0 }),
      });
      const data = await res.json();
      if (generation !== fetchListGeneration.current) return;
      if (!res.ok) {
        if (data?.errorId) setListErrorId(String(data.errorId));
        throw new Error(data.error || t('errorLoadProducts'));
      }
      setListStandard(data.ListDefaultStandardProductObj ?? []);
      setListPromo(data.ListDefaultPromotionProductObj ?? []);
      const first = data.ListDefaultStandardProductObj?.[0];
      if (first) {
        setSelectedProduct((prev) => prev ?? first);
        setDpPercent((prev) => (prev === 10 ? first.DPPrcnt : prev));
      }
    } catch (e) {
      if (generation !== fetchListGeneration.current) return;
      setError(e instanceof Error ? e.message : t('errorLoadProducts'));
    } finally {
      if (generation === fetchListGeneration.current) {
        setLoading(false);
      }
    }
  };

  const handleCalculate = async () => {
    if (!selectedProduct || !otrPrice) return;
    setSimulateLoading(true);
    setSimulateError(null);
    setErrorId(null);
    try {
      const res = await fetch('/api/simulation/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadNo,
          LeadNo: leadNo,
          otrPrice,
          dpPrcnt: dpPercent,
          productCode: selectedProduct.ProductCode,
          productName: selectedProduct.ProductName,
          firstInstallment,
          isPromotion: tab === 'Promotion',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.errorId) setErrorId(String(data.errorId));
        throw new Error(data.error || t('errorCalculate'));
      }
      setTableRows(data.ListProductObj ?? []);
      const row36 = (data.ListProductObj ?? []).find((r: ProductCalculation) => r.Tenor === 36);
      const first = (data.ListProductObj ?? [])[0];
      setSelectedTenor(row36?.Tenor ?? first?.Tenor ?? 36);
    } catch (e) {
      setSimulateError(e instanceof Error ? e.message : t('errorCalculate'));
      setTableRows([]);
    } finally {
      setSimulateLoading(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  const highlightedRow = tableRows.find((r) => r.Tenor === selectedTenor);

  useEffect(() => {
    if (highlightedRow) onSelectProduct?.(highlightedRow);
  }, [highlightedRow, onSelectProduct]);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-900">
        <div className="text-gray-500">{t('loadingProducts')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <SimulationRetryError
        title={t('errorTitle')}
        message={error}
        hint={t('errorRetryHint')}
        secondaryHint={t('errorRetrySecondaryHint')}
        retryLabel={loading ? t('loadingProducts') : t('retryLoad')}
        onRetry={fetchList}
        retrying={loading}
        errorId={listErrorId}
      />
    );
  }

  return (
    <div className="space-y-6 text-gray-900">
      <div>
        <h2 className="text-2xl font-semibold mb-2">{t('selectCreditProduct')}</h2>
        <p className="text-gray-500">{t('selectProductSubtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-gray-100 border border-gray-200">
        <button
          type="button"
          onClick={() => setTab('Standard')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
            tab === 'Standard' ? 'bg-[#002c5f] text-white' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('standard')}
        </button>
        <button
          type="button"
          onClick={() => setTab('Promotion')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
            tab === 'Promotion' ? 'bg-[#002c5f] text-white' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('promotion')}
        </button>
      </div>

      {/* Product cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(tab === 'Promotion' && listPromo.length === 0 ? listStandard : products).map((p) => (
          <button
            key={`${p.ProductCode}-${p.ProductName}`}
            type="button"
            onClick={() => {
              setSelectedProduct(p);
              setDpPercent(p.DPPrcnt);
              setTableRows([]);
            }}
            className={`p-4 rounded-xl border-2 text-left transition flex flex-col justify-start ${
              selectedProduct?.ProductName === p.ProductName
                ? 'border-[#002c5f] bg-[#002c5f]/10'
                : 'border-gray-200 hover:border-[#002c5f]/50'
            }`}
          >
            <div className="font-semibold mb-2">{p.ProductName}</div>
            <div className="text-xs text-gray-500 mb-1">TDP: {formatCurrency(p.TdpAmt)}</div>
            <div className="text-sm font-bold text-[#002c5f]">
              Installment: {formatCurrency(p.InstallmentAmt)}
            </div>
          </button>
        ))}
      </div>

      {selectedProduct && (
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 space-y-4">
          <div className="text-sm font-medium text-gray-700">
            {t('selected')} <span className="text-gray-900">{selectedProduct.ProductName}</span>
          </div>

          {/* OTR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('otr')}</label>
            <div className="text-lg font-semibold">{otrPrice != null ? formatCurrency(otrPrice) : '-'}</div>
          </div>

          {/* DP % */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('dpPercent')}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[10, 15, 20, 25, 30, 35, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDpPercent(pct)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    dpPercent === pct ? 'bg-[#002c5f] text-white' : 'bg-white border border-gray-300 hover:border-[#002c5f]'
                  }`}
                >
                  {pct} %
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={80}
                value={dpPercent}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isNaN(v) && v >= 5 && v <= 80) setDpPercent(v);
                }}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              />
              <span className="text-gray-500">%</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              DP: {otrPrice != null ? formatCurrency(Math.round((otrPrice * dpPercent) / 100)) : '-'}
            </p>
          </div>

          {/* ADDM / ADDB */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('firstInstallmentType')}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFirstInstallment('ADDM')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                  firstInstallment === 'ADDM' ? 'bg-[#002c5f] text-white' : 'bg-white border border-gray-300'
                }`}
              >
                ADDM
              </button>
              <button
                type="button"
                onClick={() => setFirstInstallment('ADDB')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                  firstInstallment === 'ADDB' ? 'bg-[#002c5f] text-white' : 'bg-white border border-gray-300'
                }`}
              >
                ADDB
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {t('addmAddbHint')}
            </p>
          </div>

          {/* <button
            type="button"
            onClick={handleCalculate}
            disabled={simulateLoading || !otrPrice}
            className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer transition-colors duration-300"
          >
            {simulateLoading ? 'Menghitung...' : 'Hitung'}
          </button> */}

          {simulateLoading && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm text-center">
              {t('calculating')}
            </div>
          )}

          {simulateError && (
            <SimulationRetryError
              compact
              title={t('errorCalculate')}
              message={simulateError}
              hint={t('errorRetryHint')}
              retryLabel={simulateLoading ? t('calculating') : t('retryCalculate')}
              onRetry={handleCalculate}
              retrying={simulateLoading}
              errorId={errorId}
            />
          )}

          {/* Table */}
          {tableRows.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-3">{t('resultPerTenor')}</div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left py-2 px-3 font-medium">#</th>
                      <th className="text-left py-2 px-3 font-medium">{t('tenor')}</th>
                      <th className="text-right py-2 px-3 font-medium">{t('totalDp')}</th>
                      <th className="text-right py-2 px-3 font-medium">{t('installmentPerMonth')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((r) => (
                      <tr
                        key={r.Tenor}
                        className={`border-t border-gray-200 ${
                          r.Tenor === selectedTenor ? 'bg-[#002c5f]/10' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-2 px-3">
                          <input
                            type="radio"
                            name="tenor"
                            checked={r.Tenor === selectedTenor}
                            onChange={() => setSelectedTenor(r.Tenor)}
                            className="text-[#002c5f]"
                          />
                        </td>
                        <td className="py-2 px-3">{r.Tenor} {t('months')}</td>
                        <td className="py-2 px-3 text-right font-medium">{formatCurrency(r.TdpAmt)}</td>
                        <td className="py-2 px-3 text-right font-bold text-[#002c5f]">
                          {formatCurrency(r.InstallmentAmt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {highlightedRow && (
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <h3 className="font-semibold">{selectedProduct.ProductName}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">{t('totalDp')}</div>
                  <div className="font-semibold">{formatCurrency(highlightedRow.TdpAmt)}</div>
                </div>
                <div>
                  <div className="text-gray-500">{t('installmentPerMonth')}</div>
                  <div className="font-bold text-[#002c5f]">{formatCurrency(highlightedRow.InstallmentAmt)}</div>
                </div>
                <div>
                  <div className="text-gray-500">{t('tenor')}</div>
                  <div className="font-semibold">{highlightedRow.Tenor} {t('months')}</div>
                </div>
                <div>
                  <div className="text-gray-500">{t('effectiveRate')}</div>
                  <div className="font-semibold">{highlightedRow.EffRatePrcnt}%</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={`https://wa.me/${whatsappLeadPhone || '628111500708'}?text=${encodeURIComponent(
                    `Halo, saya tertarik simulasi:\n${selectedProduct.ProductName}\nDP ${dpPercent}%\nTenor ${highlightedRow.Tenor} bln\nAngsuran ${formatCurrency(highlightedRow.InstallmentAmt)}/bln`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 h-11 bg-green-600 rounded-lg font-semibold hover:bg-green-700 transition cursor-pointer transition-colors duration-300"
                >
                  <IconBrandWhatsapp size={20} className="text-gray-100" />
                  <span className="text-gray-100">{t('whatsapp')}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 h-11 border-2 border-blue-500 text-blue-500 rounded-lg font-semibold hover:bg-blue-500/10 transition cursor-pointer transition-colors duration-300"
                >
                  <IconSend size={20} />
                  {t('contact')}
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryOpen(true)}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 h-11 border-2 border-blue-500 text-blue-500 rounded-lg font-semibold hover:bg-blue-500/10 transition cursor-pointer transition-colors duration-300"
                >
                  <IconFileDescription size={20} />
                  {t('viewSummary')}
                </button>
              </div>
              <SimulationSummaryModal
                open={summaryOpen}
                onClose={() => setSummaryOpen(false)}
                product={highlightedRow}
                vehicle={vehicle}
                otrPrice={otrPrice ?? 0}
                discount={discount}
                dpPercent={dpPercent}
                firstInstallment={firstInstallment}
              />
              <ContactModal
                open={contactOpen}
                onClose={() => setContactOpen(false)}
                dealer={dealer}
                userLocation={userLocation}
                productName={
                  highlightedRow
                    ? `${selectedProduct?.ProductName} - Tenor ${highlightedRow.Tenor} bulan`
                    : selectedProduct?.ProductName
                }
                otrPrice={otrPrice ?? undefined}
                dpPercent={dpPercent}
                tenor={highlightedRow?.Tenor}
                vehicleSummary={
                  vehicle
                    ? [vehicle.modelName, vehicle.trimName, vehicle.exteriorColor, vehicle.interiorColor]
                        .filter(Boolean)
                        .join(' · ')
                    : undefined
                }
                assetSnapshot={assetSnapshot}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
