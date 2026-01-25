'use client';

import { useEffect, useState } from 'react';
import type { ProductCalculation } from '@/app/types/credit-simulation';
import { IconPhone, IconBrandWhatsapp } from '@tabler/icons-react';

interface ResultStepProps {
  leadNo?: string;
  onSelectProduct?: (product: ProductCalculation) => void;
}

export function ResultStep({ leadNo, onSelectProduct }: ResultStepProps) {
  const [products, setProducts] = useState<ProductCalculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductCalculation | null>(null);

  useEffect(() => {
    // TODO: Implement actual API call when LeadNo is available
    // For now, we'll show a mock or placeholder
    if (leadNo) {
      fetchProducts();
    }
  }, [leadNo]);

  const fetchProducts = async () => {
    if (!leadNo) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/simulation/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ LeadNo: leadNo }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate products');
      }

      if (data.ListProductObj) {
        setProducts(data.ListProductObj);
        // Select default product if available
        const defaultProduct = data.ListProductObj.find((p: ProductCalculation) => p.Default);
        if (defaultProduct) {
          setSelectedProduct(defaultProduct);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to calculate products');
      console.error('Error calculating products:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleWhatsApp = () => {
    if (!selectedProduct) return;
    const message = encodeURIComponent(
      `Halo, saya tertarik dengan simulasi kredit berikut:\n\n` +
      `Produk: ${selectedProduct.ProductName}\n` +
      `DP: ${formatCurrency(selectedProduct.TdpAmt)}\n` +
      `Angsuran: ${formatCurrency(selectedProduct.InstallmentAmt)}/bulan\n` +
      `Tenor: ${selectedProduct.Tenor} bulan`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-[var(--muted)]">Menghitung simulasi kredit...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-700 font-semibold mb-2">Error</div>
        <div className="text-red-600">{error}</div>
        <div className="mt-4 text-sm text-[var(--muted)]">
          <p>Catatan: Simulasi kredit memerlukan Lead Number yang valid. Untuk saat ini, fitur ini sedang dalam pengembangan.</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-[var(--muted)] mb-4">Belum ada data simulasi</div>
        <div className="text-sm text-[var(--muted)]">
          <p>Untuk mendapatkan simulasi kredit yang akurat, silakan hubungi sales kami.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Hasil Simulasi Kredit</h2>
        <p className="text-[var(--muted)]">Pilih produk kredit yang sesuai dengan kebutuhan Anda</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <button
            key={product.ProductCode}
            type="button"
            onClick={() => {
              setSelectedProduct(product);
              onSelectProduct?.(product);
            }}
            className={`p-6 border-2 rounded-xl text-left transition ${
              selectedProduct?.ProductCode === product.ProductCode
                ? 'border-[#008AEC] bg-[#008AEC]/10 shadow-lg'
                : 'border-[var(--border)] hover:border-[#008AEC]/50 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-lg">{product.ProductName}</div>
                {product.Default && (
                  <div className="text-xs text-[#008AEC] mt-1">★ Rekomendasi</div>
                )}
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Down Payment:</span>
                <span className="font-semibold">{formatCurrency(product.TdpAmt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Angsuran/Bulan:</span>
                <span className="font-bold text-lg text-[#008AEC]">
                  {formatCurrency(product.InstallmentAmt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Tenor:</span>
                <span className="font-semibold">{product.Tenor} bulan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Bunga Efektif:</span>
                <span className="font-semibold">{product.EffRatePrcnt}%</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedProduct && (
        <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl space-y-4">
          <div className="border-b border-[var(--border)] pb-4">
            <h3 className="font-semibold text-lg mb-3">{selectedProduct.ProductName}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[var(--muted)]">Down Payment</div>
                <div className="font-semibold text-lg">{formatCurrency(selectedProduct.TdpAmt)}</div>
                <div className="text-xs text-[var(--muted)]">{selectedProduct.DPPrcnt}% dari OTR</div>
              </div>
              <div>
                <div className="text-[var(--muted)]">Angsuran per Bulan</div>
                <div className="font-bold text-xl text-[#008AEC]">
                  {formatCurrency(selectedProduct.InstallmentAmt)}
                </div>
                <div className="text-xs text-[var(--muted)]">{selectedProduct.Tenor} bulan</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[var(--muted)]">Bunga Efektif</div>
              <div className="font-semibold">{selectedProduct.EffRatePrcnt}%</div>
            </div>
            <div>
              <div className="text-[var(--muted)]">Biaya Admin</div>
              <div className="font-semibold">{formatCurrency(selectedProduct.AdminFeeAmt)}</div>
            </div>
            <div>
              <div className="text-[var(--muted)]">Biaya Provisi</div>
              <div className="font-semibold">{formatCurrency(selectedProduct.ProvisionFee || 0)}</div>
            </div>
            <div>
              <div className="text-[var(--muted)]">Biaya Fiducia</div>
              <div className="font-semibold">{formatCurrency(selectedProduct.FiduciaFeeAmt)}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)] flex gap-3">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <IconBrandWhatsapp size={20} />
              Hubungi via WhatsApp
            </button>
            <button
              type="button"
              className="px-6 py-3 border-2 border-[#1956FF] text-[#1956FF] rounded-lg font-semibold hover:bg-[#1956FF]/10 transition"
            >
              <IconPhone size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
