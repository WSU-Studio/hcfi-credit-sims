'use client';

import { useState } from 'react';

interface PriceStepProps {
  modelName: string;
  suggestedPrice?: number;
  onComplete: (price: number) => void;
}

export function PriceStep({ modelName, suggestedPrice, onComplete }: PriceStepProps) {
  const [price, setPrice] = useState<number | ''>(suggestedPrice || '');

  const formatPrice = (value: number | '') => {
    if (value === '') return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setPrice(value === '' ? '' : Number(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (price && price > 0) {
      onComplete(price as number);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Harga Kendaraan (OTR)</h2>
        <p className="text-[var(--muted)]">Masukkan harga On The Road untuk kendaraan {modelName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Harga OTR <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={price === '' ? '' : formatPrice(price)}
              onChange={handlePriceChange}
              placeholder="Masukkan harga OTR"
              className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:ring-2 focus:ring-[#008AEC] focus:border-transparent text-lg"
              required
            />
          </div>
          {suggestedPrice && (
            <button
              type="button"
              onClick={() => setPrice(suggestedPrice)}
              className="mt-2 text-sm text-[#008AEC] hover:underline"
            >
              Gunakan harga starting: {formatPrice(suggestedPrice)}
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!price || price <= 0}
          className="w-full px-6 py-3 bg-[#1956FF] text-white rounded-lg font-semibold hover:bg-[#1956FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Hitung Simulasi Kredit
        </button>
      </form>
    </div>
  );
}
