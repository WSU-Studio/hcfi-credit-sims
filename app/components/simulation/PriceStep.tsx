'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const MAX_DISCOUNT_PERCENT = 0.25; // Maksimal diskon 25% dari harga OTR

interface PriceStepProps {
  modelName: string;
  suggestedPrice?: number;
  onComplete: (netPrice: number, discount: number) => void;
}

export function PriceStep({ modelName, suggestedPrice, onComplete }: PriceStepProps) {
  const t = useTranslations('creditSimulation');
  const [discount, setDiscount] = useState<number | ''>(0);
  const [error, setError] = useState<string | null>(null);

  const otrPrice = suggestedPrice ?? 0;

  const formatPrice = (value: number | '') => {
    if (value === '' || (typeof value === 'number' && isNaN(value))) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const value = e.target.value.replace(/[^\d]/g, '');
    setDiscount(value === '' ? '' : Number(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otrPrice || otrPrice <= 0) {
      setError(t('otrRequired'));
      return;
    }

    const discountVal = typeof discount === 'number' ? discount : 0;
    if (discountVal < 0) {
      setError(t('discountMinError'));
      return;
    }

    const maxDiscount = Math.floor(otrPrice * MAX_DISCOUNT_PERCENT);
    if (discountVal > maxDiscount) {
      setError(
        t('discountMaxError', {
          max: formatPrice(maxDiscount),
          percent: Math.round(MAX_DISCOUNT_PERCENT * 100),
        })
      );
      return;
    }

    const netPrice = otrPrice - discountVal;
    if (netPrice <= 0) {
      setError(t('discountExceedsOtrError'));
      return;
    }

    onComplete(netPrice, discountVal);
  };

  return (
    <div className="space-y-6 text-gray-900">
      <div>
        <h2 className="text-2xl font-semibold mb-2">{t('priceStepTitle')}</h2>
        <p className="text-[var(--muted)]">
          {t('priceStepDescription', { modelName })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('otrLabel')} <span className="text-red-500">*</span>
          </label>
          <div
            className={`w-full px-4 py-3 border rounded-lg bg-gray-100 text-lg ${
              error ? 'border-red-500' : 'border-[var(--border)]'
            }`}
            aria-readonly
          >
            {otrPrice > 0 ? formatPrice(otrPrice) : '-'}
          </div>
          {suggestedPrice && (
            <p className="mt-1 text-xs text-gray-500">
              {t('priceHint')}
            </p>
          )}
          {error && (
            <p id="otr-error" className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="discount" className="block text-sm font-medium mb-2">
            {t('discountLabel')} <span className="text-gray-400 font-normal">(opsional)</span>
          </label>
          <input
            type="text"
            id="discount"
            value={discount === '' || discount === 0 ? '' : formatPrice(discount)}
            onChange={handleDiscountChange}
            placeholder={t('discountPlaceholder')}
            className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:ring-2 focus:ring-[#002c5f] focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('discountHint', { percent: Math.round(MAX_DISCOUNT_PERCENT * 100) })}
          </p>
        </div>

        <button
          type="submit"
          disabled={!otrPrice || otrPrice <= 0}
          className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer transition-colors duration-300"
        >
          {t('submitPrice')}
        </button>
      </form>
    </div>
  );
}
