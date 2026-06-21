'use client';

import { useEffect, useState } from 'react';
import { DealerLink } from '@/app/components/dealer/DealerLink';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import {
  DISCOUNT_TYPES,
  formatDiscountLabel,
  isPromotionCurrentlyValid,
} from '@/lib/dealer-promotion';

type Promotion = {
  id: string;
  assetCode: string;
  assetName: string | null;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  notes: string | null;
  updatedAt: string;
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'medium' });
};

export function DealerPromotionsTable() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPromotions = () =>
    fetch('/api/dealer/promotions')
      .then((res) => res.json())
      .then((data) => setPromotions(data.promotions || []));

  useEffect(() => {
    loadPromotions().finally(() => setLoading(false));
  }, []);

  const handleDelete = async (promo: Promotion) => {
    if (
      !confirm(
        `Hapus promo diskon untuk "${promo.assetName ?? promo.assetCode}"?`
      )
    ) {
      return;
    }
    setDeletingId(promo.id);
    try {
      const res = await fetch(`/api/dealer/promotions/${promo.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus promo');
      await loadPromotions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus promo');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Memuat promo...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Daftar Promo Diskon</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Satu promo per model — berlaku otomatis saat quotation
          </p>
        </div>
        <DealerLink
          href="/dealer/promotions/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#002c5f] text-white rounded-lg hover:bg-[#001f45] transition-colors text-sm font-medium"
        >
          <IconPlus size={18} />
          Tambah Promo
        </DealerLink>
      </div>

      {promotions.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500 text-sm">
          Belum ada promo diskon. Tambahkan promo per model mobil.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Diskon
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Periode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {promotions.map((promo) => {
                const live = isPromotionCurrentlyValid({
                  isActive: promo.isActive,
                  validFrom: promo.validFrom ? new Date(promo.validFrom) : null,
                  validTo: promo.validTo ? new Date(promo.validTo) : null,
                });

                return (
                  <tr key={promo.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {promo.assetName ?? promo.assetCode}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {promo.assetCode}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDiscountLabel(promo)}
                      {promo.discountType === DISCOUNT_TYPES.FIXED && (
                        <span className="block text-xs text-gray-400">Nominal tetap</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <div>{formatDate(promo.validFrom)} → {formatDate(promo.validTo)}</div>
                      {!promo.validFrom && !promo.validTo && (
                        <span className="text-gray-400">Tanpa batas waktu</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          live
                            ? 'bg-emerald-100 text-emerald-800'
                            : promo.isActive
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {live ? 'Aktif' : promo.isActive ? 'Di luar periode' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <DealerLink
                          href={`/dealer/promotions/${promo.id}/edit`}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-blue-200 hover:bg-blue-50"
                          title="Edit"
                        >
                          <IconEdit size={16} className="text-blue-600" />
                        </DealerLink>
                        <button
                          type="button"
                          onClick={() => handleDelete(promo)}
                          disabled={deletingId === promo.id}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50"
                          title="Hapus"
                        >
                          <IconTrash size={16} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
