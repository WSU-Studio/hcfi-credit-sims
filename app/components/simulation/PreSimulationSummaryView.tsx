'use client';

import type { FinalSummaryInfo } from '@/app/types/credit-simulation';

type Props = {
  title: string;
  vehicleSummary?: string | null;
  vendorLabel?: string | null;
  discount?: number | null;
  firstInstallment?: string | null;
  summary: FinalSummaryInfo;
};

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n);
}

/**
 * Public / print-friendly summary for a saved pre-simulation (no live Hyundai call).
 */
export function PreSimulationSummaryView({
  title,
  vehicleSummary,
  vendorLabel,
  discount,
  firstInstallment,
  summary,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden text-gray-900">
      <div className="bg-[#002c5f] px-6 py-5 text-white">
        <p className="text-xs uppercase tracking-wide text-white/70">Pre-Simulasi Kredit</p>
        <h1 className="mt-1 text-xl font-semibold leading-snug">{title}</h1>
        {vehicleSummary && <p className="mt-2 text-sm text-white/85">{vehicleSummary}</p>}
        {vendorLabel && <p className="mt-1 text-xs text-white/70">{vendorLabel}</p>}
      </div>

      <div className="p-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Produk</p>
            <p className="font-semibold">{summary.productName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Skema cicilan pertama</p>
            <p className="font-semibold">{firstInstallment || summary.firstInstallment || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">DP</p>
            <p className="font-semibold">{summary.assetDownPaymentPrcnt}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tenor</p>
            <p className="font-semibold">{summary.tenor} bulan</p>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Angsuran / bulan</p>
            <p className="text-lg font-bold text-[#002c5f]">{formatRp(summary.instAmt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Down Payment</p>
            <p className="text-lg font-bold text-[#002c5f]">
              {formatRp(summary.totalDownPaymentAmt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Harga aset</p>
            <p className="font-semibold">{formatRp(summary.assetPriceAmt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Flat rate</p>
            <p className="font-semibold">{summary.flatRatePrcnt}%</p>
          </div>
          {discount != null && discount > 0 && (
            <div>
              <p className="text-xs text-gray-500">Diskon</p>
              <p className="font-semibold">{formatRp(discount)}</p>
            </div>
          )}
          {summary.balloonAmt != null && summary.balloonAmt > 0 && (
            <div>
              <p className="text-xs text-gray-500">Nilai Balloon</p>
              <p className="font-semibold">{formatRp(summary.balloonAmt)}</p>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between gap-2 border-b border-gray-100 py-2">
            <span className="text-gray-500">DP amount</span>
            <span className="font-medium">{formatRp(summary.downPaymentAmt)}</span>
          </div>
          <div className="flex justify-between gap-2 border-b border-gray-100 py-2">
            <span className="text-gray-500">Asuransi aset</span>
            <span className="font-medium">{formatRp(summary.assetInsPaidAmt)}</span>
          </div>
          <div className="flex justify-between gap-2 border-b border-gray-100 py-2">
            <span className="text-gray-500">Biaya</span>
            <span className="font-medium">{formatRp(summary.feePaidAmt)}</span>
          </div>
          <div className="flex justify-between gap-2 border-b border-gray-100 py-2">
            <span className="text-gray-500">Total pembayaran</span>
            <span className="font-medium">{formatRp(summary.totalPaymentAmt)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Ringkasan ini dihasilkan dari pre-simulasi resmi Hyundai Capital. Angka bersifat indikatif
          dan dapat berubah sesuai proses analisa kredit selanjutnya.
        </p>
      </div>
    </div>
  );
}
