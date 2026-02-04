'use client';

import { useEffect, useState } from 'react';
import { IconDeviceFloppy, IconPlus, IconTrash } from '@tabler/icons-react';

type FooterData = {
  address: string[];
  phoneDisplay: string;
  phoneHref: string;
  whatsappDisplay: string;
  whatsappHref: string;
  emailDisplay: string;
  emailHref: string;
  playStoreHref: string;
  appStoreHref: string;
  disclaimer: string;
  copyright: string;
};

const defaultData: FooterData = {
  address: [''],
  phoneDisplay: '',
  phoneHref: '',
  whatsappDisplay: '',
  whatsappHref: '',
  emailDisplay: '',
  emailHref: '',
  playStoreHref: '',
  appStoreHref: '',
  disclaimer: '',
  copyright: '',
};

function ensureString(v: unknown): string {
  if (v == null) return '';
  return typeof v === 'string' ? v : String(v);
}

export function FooterSettings() {
  const [data, setData] = useState<FooterData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/footer')
      .then((res) => res.json())
      .then((result) => {
        if (result.data) {
          const d = result.data;
          const contact = Array.isArray(d.contact) ? d.contact : [];
          const apps = Array.isArray(d.apps) ? d.apps : [];
          const addressRaw = Array.isArray(d.address) ? d.address : [];
          const address = addressRaw.length > 0 ? addressRaw.map(ensureString) : [''];

          setData({
            address,
            phoneDisplay: ensureString(d.phoneDisplay || (contact[0] as { text?: string } | undefined)?.text) || defaultData.phoneDisplay,
            phoneHref: ensureString(d.phoneHref || (contact[0] as { href?: string } | undefined)?.href) || defaultData.phoneHref,
            whatsappDisplay: ensureString(d.whatsappDisplay || (contact[1] as { text?: string } | undefined)?.text) || defaultData.whatsappDisplay,
            whatsappHref: ensureString(d.whatsappHref || (contact[1] as { href?: string } | undefined)?.href) || defaultData.whatsappHref,
            emailDisplay: ensureString(d.emailDisplay || (contact[2] as { text?: string } | undefined)?.text) || defaultData.emailDisplay,
            emailHref: ensureString(d.emailHref || (contact[2] as { href?: string } | undefined)?.href) || defaultData.emailHref,
            playStoreHref: ensureString(d.playStoreHref || (apps[0] as { href?: string } | undefined)?.href) || defaultData.playStoreHref,
            appStoreHref: ensureString(d.appStoreHref || (apps[1] as { href?: string } | undefined)?.href) || defaultData.appStoreHref,
            disclaimer: ensureString(d.disclaimer) || defaultData.disclaimer,
            copyright: ensureString(d.copyright) || defaultData.copyright,
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setMessage({ type: 'error', text: 'Gagal memuat data' });
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/footer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: data.address.filter((line) => line.trim() !== ''),
          phoneDisplay: data.phoneDisplay.trim(),
          phoneHref: data.phoneHref.trim(),
          whatsappDisplay: data.whatsappDisplay.trim(),
          whatsappHref: data.whatsappHref.trim(),
          emailDisplay: data.emailDisplay.trim(),
          emailHref: data.emailHref.trim(),
          playStoreHref: data.playStoreHref.trim(),
          appStoreHref: data.appStoreHref.trim(),
          disclaimer: data.disclaimer.trim(),
          copyright: data.copyright.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan');
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal menyimpan pengaturan',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateAddress = (idx: number, value: string) => {
    const next = [...data.address];
    next[idx] = value;
    setData({ ...data, address: next });
  };
  const addAddressLine = () => setData({ ...data, address: [...data.address, ''] });
  const removeAddressLine = (idx: number) => {
    if (data.address.length <= 1) return;
    setData({ ...data, address: data.address.filter((_, i) => i !== idx) });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Memuat...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Alamat (satu baris per isian)</label>
        <div className="space-y-2">
          {data.address.map((line, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={line ?? ''}
                onChange={(e) => updateAddress(idx, e.target.value)}
                className="flex-1 px-3 h-9 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
                placeholder="Baris alamat"
              />
              <button
                type="button"
                onClick={() => removeAddressLine(idx)}
                disabled={data.address.length <= 1}
                className="px-3 h-9 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                title="Hapus baris"
              >
                <IconTrash size={18} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addAddressLine}
            className="inline-flex items-center gap-1 text-sm text-[#008AEC] hover:text-[#1956FF]"
          >
            <IconPlus size={16} />
            Tambah baris alamat
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Customer Care</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone — teks yang ditampilkan</label>
            <input
              type="text"
              value={data.phoneDisplay ?? ''}
              onChange={(e) => setData({ ...data, phoneDisplay: e.target.value })}
              className="w-full px-3 h-9 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
              placeholder="1500708"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone — link (nilai untuk tel:)</label>
            <input
              type="text"
              value={data.phoneHref ?? ''}
              onChange={(e) => setData({ ...data, phoneHref: e.target.value })}
              className="w-full px-3 h-9 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
              placeholder="tel:1500708"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp — teks yang ditampilkan</label>
            <input
              type="text"
              value={data.whatsappDisplay ?? ''}
              onChange={(e) => setData({ ...data, whatsappDisplay: e.target.value })}
              className="w-full px-3 h-9 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
              placeholder="08111500708"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp — nomor HP (0 otomatis jadi 62)</label>
            <input
              type="text"
              inputMode="numeric"
              value={data.whatsappHref ?? ''}
              onChange={(e) => setData({ ...data, whatsappHref: e.target.value })}
              className="w-full px-3 h-9 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
              placeholder="08111500708"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email — teks yang ditampilkan</label>
            <input
              type="text"
              value={data.emailDisplay ?? ''}
              onChange={(e) => setData({ ...data, emailDisplay: e.target.value })}
              className="w-full px-3 h-9 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
              placeholder="contactus@hyundaicapital.co.id"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email — alamat email (untuk link)</label>
            <input
              type="email"
              value={data.emailHref ?? ''}
              onChange={(e) => setData({ ...data, emailHref: e.target.value })}
              className="w-full px-3 h-9 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
              placeholder="contactus@hyundaicapital.co.id"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Link aplikasi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link ke Play Store</label>
            <input
              type="url"
              value={data.playStoreHref ?? ''}
              onChange={(e) => setData({ ...data, playStoreHref: e.target.value })}
              className="w-full px-3 h-9 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
              placeholder="https://play.google.com/store/apps/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link ke App Store</label>
            <input
              type="url"
              value={data.appStoreHref ?? ''}
              onChange={(e) => setData({ ...data, appStoreHref: e.target.value })}
              className="w-full px-3 h-9 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
              placeholder="https://apps.apple.com/..."
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Disclaimer</label>
        <input
          type="text"
          value={data.disclaimer ?? ''}
          onChange={(e) => setData({ ...data, disclaimer: e.target.value })}
          className="w-full px-3 h-9 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
          placeholder="PT ... berizin dan diawasi oleh Otoritas Jasa Keuangan"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Copyright</label>
        <input
          type="text"
          value={data.copyright ?? ''}
          onChange={(e) => setData({ ...data, copyright: e.target.value })}
          className="w-full px-3 h-9 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#008AEC] focus:border-[#008AEC]"
          placeholder="Copyright © 2025 - All Right Reserved"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1956FF] text-white rounded-lg hover:bg-[#1956FF]/90 transition-colors disabled:opacity-50"
        >
          <IconDeviceFloppy size={20} />
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  );
}
