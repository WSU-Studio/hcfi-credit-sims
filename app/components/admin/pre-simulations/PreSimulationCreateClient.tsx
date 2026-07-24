'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { SimulationWizard } from '@/app/components/simulation/SimulationWizard';
import { PRE_SIMULATION_LABELS } from '@/lib/simulation-wizard-labels';
import { LEAD_SOURCES } from '@/lib/lead-source';
import { slugifyPreSimulationTitle } from '@/lib/pre-simulation';
import idMessages from '@/messages/id.json';

type CapturePayload = Parameters<
  NonNullable<React.ComponentProps<typeof SimulationWizard>['onCapturePreSimulation']>
>[0];

export function PreSimulationCreateClient() {
  const router = useRouter();
  const [draft, setDraft] = useState<CapturePayload | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openSaveDialog = (payload: CapturePayload) => {
    const defaultTitle = [
      payload.asset.AssetName,
      payload.specs.trimName,
      payload.productName,
      `DP ${payload.dpPercent}%`,
      `${payload.tenor} bln`,
    ]
      .filter(Boolean)
      .join(' · ');
    setDraft(payload);
    setTitle(defaultTitle);
    setSlug(slugifyPreSimulationTitle(defaultTitle));
    setSlugTouched(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!title.trim() || !slug.trim()) {
      setError('Judul dan slug wajib diisi');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const vehicleSummary = [
        draft.specs.manufacturingYear
          ? `${draft.specs.manufacturingYear} ${draft.asset.AssetName}`
          : draft.asset.AssetName,
        draft.specs.trimName,
        draft.specs.exteriorColorName,
        draft.specs.interiorColorName,
      ]
        .filter(Boolean)
        .join(' · ');

      const res = await fetch('/api/admin/pre-simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          isPublished: true,
          vendorCode: draft.dealer.VendorCode,
          vendorName: draft.dealer.VendorName,
          vendorCity: draft.dealer.City,
          oriOfficeCode: draft.dealer.OriOfficeCode,
          oriOfficeName: draft.dealer.OriOfficeName,
          modelCode: draft.asset.AssetCode,
          modelName: draft.asset.AssetName,
          manufacturingYear: draft.specs.manufacturingYear ?? null,
          fscCode: draft.specs.fscCode ?? null,
          trimName: draft.specs.trimName ?? null,
          exteriorColorCode: draft.specs.exteriorColorCode ?? null,
          exteriorColorName: draft.specs.exteriorColorName ?? null,
          interiorColorCode: draft.specs.interiorColorCode ?? null,
          interiorColorName: draft.specs.interiorColorName ?? null,
          vehicleSummary,
          assetSnapshot: draft.assetSnapshot,
          otrPrice: draft.otrPrice,
          discount: draft.discount || null,
          partnerCode: draft.partnerCode,
          simulationLeadNo: draft.leadNo,
          productCode: draft.productCode,
          productName: draft.productName,
          dpPercent: draft.dpPercent,
          tenor: draft.tenor,
          firstInstallment: draft.firstInstallment,
          isPromotion: draft.isPromotion,
          summarySnapshot: draft.summary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Gagal menyimpan');
      }
      router.push('/admin/pre-simulations');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <NextIntlClientProvider locale="id" messages={idMessages}>
      <SimulationWizard
        mode="pre-simulation"
        labels={PRE_SIMULATION_LABELS}
        leadSource={LEAD_SOURCES.WEBSITE}
        embedded
        onCapturePreSimulation={openSaveDialog}
      />

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-xl bg-white shadow-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-gray-900">Simpan Pre-Simulasi</h2>
            <p className="text-sm text-gray-500">
              Beri judul dan slug. Link publik: /id/pre-sim/[slug]
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(slugifyPreSimulationTitle(e.target.value));
                }}
                className="w-full px-3 h-11 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#002c5f] text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                }}
                className="w-full px-3 h-11 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#002c5f] font-mono text-sm text-gray-700"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-[#002c5f] text-white rounded-lg font-medium hover:bg-[#002c5f]/90 disabled:opacity-50"
              >
                {saving ? 'Menyimpan…' : 'Simpan & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </NextIntlClientProvider>
  );
}
