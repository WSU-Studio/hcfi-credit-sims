'use client';

import { useEffect } from 'react';
import type { ProductCalculation } from '@/app/types/credit-simulation';
import { IconX } from '@tabler/icons-react';

export interface VehicleSummaryInfo {
  modelName?: string;
  trimName?: string;
  exteriorColor?: string;
  interiorColor?: string;
}

interface SimulationSummaryModalProps {
  open: boolean;
  onClose: () => void;
  product: ProductCalculation;
  vehicle?: VehicleSummaryInfo;
  otrPrice: number;
  discount?: number;
  dpPercent: number;
  firstInstallment: 'ADDM' | 'ADDB';
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export function SimulationSummaryModal({
  open,
  onClose,
  product,
  vehicle,
  otrPrice,
  discount = 0,
  dpPercent,
  firstInstallment,
}: SimulationSummaryModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const dpAmt = Math.round(otrPrice * (dpPercent / 100));
  const prov = product.ProvisionType === 'PRCNT' ? Math.round((otrPrice - dpAmt) * (product.ProvisionFee / 100)) : product.ProvisionFee;
  const feePaidByCustomer = product.AdminFeeAmt + product.FiduciaFeeAmt + prov;
  const assetInsurancePaid = 0; // placeholder if not from API
  const subsidyAmt = 0;
  const installLabel = firstInstallment === 'ADDM' ? 'Installment Amount (ADDM)' : 'Installment Amount (ADDB)';
  const totalPayment =
    firstInstallment === 'ADDM'
      ? product.TdpAmt + product.InstallmentAmt * (product.Tenor - 1)
      : product.TdpAmt + product.InstallmentAmt * product.Tenor;
  const ntfAmount = otrPrice - dpAmt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 id="summary-title" className="text-lg font-semibold text-gray-900">
            Ringkasan Simulasi Kredit
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Tutup"
          >
            <IconX size={22} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Product */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Produk
            </h3>
            <p className="text-gray-900 font-medium">{product.ProductName}</p>
          </section>

          {/* Vehicle Info */}
          {(vehicle?.modelName || vehicle?.trimName || vehicle?.exteriorColor || vehicle?.interiorColor) && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                | Vehicle Info
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {vehicle.modelName && (
                  <>
                    <dt className="text-gray-500">Vehicle Model</dt>
                    <dd className="font-medium text-gray-900">{vehicle.modelName}</dd>
                  </>
                )}
                {vehicle.trimName && (
                  <>
                    <dt className="text-gray-500">Trim</dt>
                    <dd className="font-medium text-gray-900">{vehicle.trimName}</dd>
                  </>
                )}
                {vehicle.exteriorColor && (
                  <>
                    <dt className="text-gray-500">Exterior Color</dt>
                    <dd className="font-medium text-gray-900">{vehicle.exteriorColor}</dd>
                  </>
                )}
                {vehicle.interiorColor && (
                  <>
                    <dt className="text-gray-500">Interior Color</dt>
                    <dd className="font-medium text-gray-900">{vehicle.interiorColor}</dd>
                  </>
                )}
              </dl>
            </section>
          )}

          {/* Summary */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              | Summary
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">Down Payment (%)</dt>
              <dd className="font-medium text-gray-900">{dpPercent}</dd>
              <dt className="text-gray-500">Tenor</dt>
              <dd className="font-medium text-gray-900">{product.Tenor}</dd>
              <dt className="text-gray-500">Flat Rate (%)</dt>
              <dd className="font-medium text-gray-900">{product.EffRatePrcnt}</dd>
              <dt className="text-gray-500">Insurance Type</dt>
              <dd className="font-medium text-gray-900">COMPRE</dd>
              <dt className="text-gray-500">Insurance Payment Type</dt>
              <dd className="font-medium text-gray-900">In Advance</dd>
              <dt className="text-gray-500">Fee Payment Type</dt>
              <dd className="font-medium text-gray-900">In Advance</dd>
              <dt className="text-gray-500">{installLabel}</dt>
              <dd className="font-semibold text-gray-900">{formatRp(product.InstallmentAmt)}</dd>
              <dt className="text-gray-500">Total Down Payment</dt>
              <dd className="font-semibold text-gray-900">{formatRp(product.TdpAmt)}</dd>
              <dt className="text-gray-500">Total Payment</dt>
              <dd className="font-semibold text-[#002c5f]">{formatRp(totalPayment)}</dd>
            </dl>
          </section>

          {/* Total Down Payment */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              | Total Down Payment
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">Down Payment</dt>
              <dd className="font-medium text-gray-900">{formatRp(dpAmt)}</dd>
              <dt className="text-gray-500">Installment Amount</dt>
              <dd className="font-medium text-gray-900">{formatRp(product.InstallmentAmt)}</dd>
              <dt className="text-gray-500">Asset Insurance Paid</dt>
              <dd className="font-medium text-gray-900">{formatRp(assetInsurancePaid)}</dd>
              <dt className="text-gray-500">Fee Paid By Customer</dt>
              <dd className="font-medium text-gray-900">{formatRp(feePaidByCustomer)}</dd>
              <dt className="text-gray-500">Subsidy Amount</dt>
              <dd className="font-medium text-gray-900">({formatRp(subsidyAmt)})</dd>
              <dt className="text-gray-500">Total Down Payment</dt>
              <dd className="font-semibold text-gray-900">{formatRp(product.TdpAmt)}</dd>
            </dl>
          </section>

          {/* NTF */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              | NTF (Net Total Financing)
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {discount > 0 && (
                <>
                  <dt className="text-gray-500">Harga OTR (Harga Aset Awal)</dt>
                  <dd className="font-medium text-gray-900">{formatRp(otrPrice + discount)}</dd>
                  <dt className="text-gray-500">Diskon</dt>
                  <dd className="font-medium text-red-600">({formatRp(discount)})</dd>
                </>
              )}
              <dt className="text-gray-500">Total Asset Price</dt>
              <dd className="font-medium text-gray-900">{formatRp(otrPrice)}</dd>
              <dt className="text-gray-500">Down Payment</dt>
              <dd className="font-medium text-gray-900">({formatRp(dpAmt)})</dd>
              <dt className="text-gray-500">Asset Insurance Capitalized</dt>
              <dd className="font-medium text-gray-900">{formatRp(0)}</dd>
              <dt className="text-gray-500">NTF Amount</dt>
              <dd className="font-semibold text-[#002c5f]">{formatRp(ntfAmount)}</dd>
            </dl>
          </section>
        </div>

        <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#002c5f] text-white rounded-lg font-medium hover:bg-[#002c5f]/90 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
