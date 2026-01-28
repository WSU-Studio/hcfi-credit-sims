'use client';

import { useEffect, useState } from 'react';
import { IconDeviceFloppy } from '@tabler/icons-react';

type FooterData = {
  address: string[];
  contact: Array<{
    label: string;
    text: string;
    href: string;
  }>;
  apps: Array<{
    label: string;
    src: string;
    href: string;
  }>;
};

export function FooterSettings() {
  const [data, setData] = useState<FooterData>({
    address: [''],
    contact: [{ label: '', text: '', href: '' }],
    apps: [{ label: '', src: '', href: '' }],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/footer')
      .then((res) => res.json())
      .then((result) => {
        if (result.data) {
          setData(result.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/footer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address (one per line)
        </label>
        <div className="space-y-2">
          {data.address.map((line, idx) => (
            <input
              key={idx}
              type="text"
              value={line}
              onChange={(e) => {
                const newAddress = [...data.address];
                newAddress[idx] = e.target.value;
                setData({ ...data, address: newAddress });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Links
        </label>
        <div className="space-y-2">
          {data.contact.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Label"
                value={item.label}
                onChange={(e) => {
                  const newContact = [...data.contact];
                  newContact[idx].label = e.target.value;
                  setData({ ...data, contact: newContact });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Text"
                value={item.text}
                onChange={(e) => {
                  const newContact = [...data.contact];
                  newContact[idx].text = e.target.value;
                  setData({ ...data, contact: newContact });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="URL"
                value={item.href}
                onChange={(e) => {
                  const newContact = [...data.contact];
                  newContact[idx].href = e.target.value;
                  setData({ ...data, contact: newContact });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          App Store Links
        </label>
        <div className="space-y-2">
          {data.apps.map((app, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Label"
                value={app.label}
                onChange={(e) => {
                  const newApps = [...data.apps];
                  newApps[idx].label = e.target.value;
                  setData({ ...data, apps: newApps });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Image URL"
                value={app.src}
                onChange={(e) => {
                  const newApps = [...data.apps];
                  newApps[idx].src = e.target.value;
                  setData({ ...data, apps: newApps });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="URL"
                value={app.href}
                onChange={(e) => {
                  const newApps = [...data.apps];
                  newApps[idx].href = e.target.value;
                  setData({ ...data, apps: newApps });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <IconDeviceFloppy size={20} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}


