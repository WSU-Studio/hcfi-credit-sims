'use client';

import { useEffect, useState } from 'react';
import { IconDeviceFloppy } from '@tabler/icons-react';

type SiteSettingsData = {
  gtmId: string;
  gaMeasurementId: string;
  whatsappFabPhone: string;
  whatsappFabMessage: string;
  whatsappLeadPhone: string;
};

const defaultData: SiteSettingsData = {
  gtmId: '',
  gaMeasurementId: '',
  whatsappFabPhone: '',
  whatsappFabMessage: '',
  whatsappLeadPhone: '',
};

function ensureString(v: unknown): string {
  if (v == null) return '';
  return typeof v === 'string' ? v : String(v);
}

export function SiteSettings() {
  const [data, setData] = useState<SiteSettingsData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((result) => {
        if (result.data) {
          const d = result.data;
          setData({
            gtmId: ensureString(d.gtmId ?? ''),
            gaMeasurementId: ensureString(d.gaMeasurementId ?? ''),
            whatsappFabPhone: ensureString(d.whatsappFabPhone ?? ''),
            whatsappFabMessage: ensureString(d.whatsappFabMessage ?? ''),
            whatsappLeadPhone: ensureString(d.whatsappLeadPhone ?? ''),
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setMessage({ type: 'error', text: 'Gagal memuat pengaturan' });
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gtmId: data.gtmId.trim(),
          gaMeasurementId: data.gaMeasurementId.trim(),
          whatsappFabPhone: data.whatsappFabPhone.trim(),
          whatsappFabMessage: data.whatsappFabMessage.trim(),
          whatsappLeadPhone: data.whatsappLeadPhone.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan');
      setMessage({ type: 'success', text: 'Pengaturan situs berhasil disimpan.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal menyimpan pengaturan',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        Memuat...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-8">
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* SEO & Analytics */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          SEO & Analytics (Google)
        </h2>
        <p className="text-sm text-gray-600">
          Isi ID dari Google Tag Manager dan/atau Google Analytics 4 untuk pelacakan dan SEO.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Tag Manager — Container ID
            </label>
            <input
              type="text"
              value={data.gtmId}
              onChange={(e) => setData({ ...data, gtmId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="GTM-XXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Analytics 4 — Measurement ID
            </label>
            <input
              type="text"
              value={data.gaMeasurementId}
              onChange={(e) => setData({ ...data, gaMeasurementId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="G-XXXXXXXXXX"
            />
          </div>
        </div>
      </section>

      {/* WhatsApp FAB */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Tombol WhatsApp (FAB)
        </h2>
        <p className="text-sm text-gray-600">
          Nomor yang dipakai pada tombol mengambang WhatsApp di pojok kanan bawah situs. Format: 62xxx atau 08xxx.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor WhatsApp
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={data.whatsappFabPhone}
              onChange={(e) => setData({ ...data, whatsappFabPhone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="628111500708"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pesan awal (opsional)
            </label>
            <input
              type="text"
              value={data.whatsappFabMessage}
              onChange={(e) => setData({ ...data, whatsappFabMessage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Halo, saya ingin bertanya..."
            />
          </div>
        </div>
      </section>

      {/* WhatsApp Leads (Simulasi) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          WhatsApp Leads (Hasil Simulasi)
        </h2>
        <p className="text-sm text-gray-600">
          Nomor WhatsApp untuk tombol di halaman hasil simulasi kredit (leads CS/SDR). Jika kosong, akan memakai nomor FAB di atas. Format: 62xxx atau 08xxx.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nomor WhatsApp Leads / CS / SDR
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={data.whatsappLeadPhone}
            onChange={(e) => setData({ ...data, whatsappLeadPhone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="628111500708"
          />
        </div>
      </section>

      <div className="pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconDeviceFloppy size={18} />
          {saving ? 'Menyimpan...' : 'Simpan pengaturan'}
        </button>
      </div>
    </div>
  );
}
