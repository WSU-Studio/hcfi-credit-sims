'use client';

import { useState } from 'react';

interface PriceStepProps {
  modelName: string;
  suggestedPrice?: number;
  onComplete: (price: number) => void;
}

export function PriceStep({ modelName, suggestedPrice, onComplete }: PriceStepProps) {
  const [price, setPrice] = useState<number | ''>(suggestedPrice || '');
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (value: number | '') => {
    if (value === '') return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const value = e.target.value.replace(/[^\d]/g, '');
    setPrice(value === '' ? '' : Number(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!price || price <= 0) {
      setError('Harga OTR harus diisi');
      return;
    }

    const minOtr = suggestedPrice ?? 0;
    if (minOtr > 0 && price < minOtr) {
      setError(
        `Harga OTR tidak boleh lebih rendah dari harga kendaraan (min. ${formatPrice(minOtr)}). OTR adalah total harga mobil, bukan uang muka (DP).`
      );
      return;
    }

    // Validasi maksimum: tidak boleh lebih dari 150% dari harga starting (untuk mencegah input yang tidak masuk akal)
    const maxOtr = minOtr > 0 ? minOtr * 1.5 : null;
    if (maxOtr && price > maxOtr) {
      setError(
        `Harga OTR terlalu tinggi. Maksimum yang wajar adalah ${formatPrice(maxOtr)} (±50% dari harga starting). Jika harga Anda berbeda, silakan hubungi dealer untuk konfirmasi.`
      );
      return;
    }

    onComplete(price as number);
  };

  return (
    <div className="space-y-6 text-gray-900">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Harga Kendaraan (OTR)</h2>
        <p className="text-[var(--muted)]">
          Masukkan <strong>total harga On The Road</strong> untuk {modelName}. OTR = harga mobil lengkap (bukan uang muka). Sistem akan menghitung DP, tenor, dan angsuran berdasarkan OTR ini.
        </p>
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
              className={`w-full px-4 py-3 border rounded-lg bg-[var(--background)] focus:ring-2 focus:ring-[#002c5f] focus:border-transparent text-lg ${
                error ? 'border-red-500' : 'border-[var(--border)]'
              }`}
              required
              aria-invalid={!!error}
              aria-describedby={error ? 'otr-error' : undefined}
            />
          </div>
          {error && (
            <p id="otr-error" className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {suggestedPrice && (
            <div className="mt-2 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setPrice(suggestedPrice);
                  setError(null);
                }}
                className="text-sm text-[#002c5f] hover:underline"
              >
                Gunakan harga starting: {formatPrice(suggestedPrice)}
              </button>
              <p className="text-xs text-gray-500">
                Harga dapat berbeda tergantung dealer, diskon, dan aksesoris. Range wajar: ±30% dari harga starting.
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!price || price <= 0}
          className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer transition-colors duration-300"
        >
          Hitung Simulasi Kredit
        </button>
      </form>
    </div>
  );
}
