'use client';

import { useState, useEffect, useCallback } from 'react';
import { CldUploadButton, CldImage } from 'next-cloudinary';
import { IconUpload, IconCopy, IconCheck, IconLink, IconCloudDownload, IconTrash } from '@tabler/icons-react';

type Media = {
  id: string;
  filename: string;
  url: string;
  cloudinaryId: string | null;
  mimeType: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  createdAt?: string;
};

function saveMediaToApi(payload: {
  filename: string;
  url: string;
  cloudinaryId?: string | null;
  mimeType?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
}) {
  return fetch('/api/admin/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (!res.ok) return res.json().then((d) => Promise.reject(new Error(d.error || 'Gagal menyimpan')));
      return res.json();
    });
}

export function MediaLibrary() {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addUrlOpen, setAddUrlOpen] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [addFilename, setAddFilename] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);
  const [addUrlError, setAddUrlError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMedia = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/media')
      .then((res) => res.json())
      .then((data) => setMediaList(data.media || []))
      .catch(() => setMediaList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleUploadSuccess = (result: any) => {
    setSaveError(null);
    const info = result?.info ?? result;
    if (!info?.secure_url) return;
    saveMediaToApi({
      filename: info.original_filename ?? info.filename ?? 'image',
      url: info.secure_url,
      cloudinaryId: info.public_id ?? null,
      mimeType: info.format ?? null,
      size: info.bytes ?? null,
      width: info.width ?? null,
      height: info.height ?? null,
    })
      .then(() => loadMedia())
      .catch((err) => setSaveError(err?.message ?? 'Gagal menyimpan ke database'));
  };

  const handleAddByUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const url = addUrl.trim();
    if (!url) {
      setAddUrlError('URL wajib diisi');
      return;
    }
    setAddUrlError(null);
    setAddingUrl(true);
    const filename = addFilename.trim() || url.split('/').pop()?.split('?')[0] || 'image';
    saveMediaToApi({
      filename,
      url,
      cloudinaryId: null,
      mimeType: null,
      size: null,
      width: null,
      height: null,
    })
      .then(() => {
        setAddUrl('');
        setAddFilename('');
        setAddUrlOpen(false);
        loadMedia();
      })
      .catch((err) => setAddUrlError(err?.message ?? 'Gagal menambah'))
      .finally(() => setAddingUrl(false));
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDelete = (item: Media) => {
    if (!confirm('Hapus dari Media Library? (Record di database akan dihapus. File di Cloudinary tidak terpengaruh.)')) return;
    setDeletingId(item.id);
    fetch(`/api/admin/media/${item.id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        loadMedia();
      })
      .catch(() => loadMedia())
      .finally(() => setDeletingId(null));
  };

  const handleImportFromCloudinary = () => {
    setSyncError(null);
    setSyncMessage(null);
    setSyncing(true);
    fetch('/api/admin/media/sync', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSyncMessage(data.message ?? `Impor berhasil. ${data.imported ?? 0} media ditambahkan.`);
        loadMedia();
      })
      .catch((err) => setSyncError(err?.message ?? 'Gagal import'))
      .finally(() => setSyncing(false));
  };

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'hcfi_media';

  if (!cloudName) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4">
        <p className="font-medium">Konfigurasi Cloudinary belum lengkap</p>
        <p className="text-sm mt-1">
          Tambahkan <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> di file .env
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <CldUploadButton
            uploadPreset={uploadPreset}
            config={{ cloud: { cloudName } }}
            onSuccess={handleUploadSuccess}
            onUpload={handleUploadSuccess}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <IconUpload size={20} />
            Upload Media
          </CldUploadButton>
          <button
            type="button"
            onClick={() => { setAddUrlOpen((v) => !v); setAddUrlError(null); }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <IconLink size={20} />
            Tambah dari URL
          </button>
          <button
            type="button"
            onClick={handleImportFromCloudinary}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <IconCloudDownload size={20} />
            {syncing ? 'Mengimpor...' : 'Import dari Cloudinary'}
          </button>
        </div>
        {syncMessage && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            {syncMessage}
          </div>
        )}
        {syncError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {syncError}
          </div>
        )}
        {saveError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {saveError}
          </div>
        )}
        {addUrlOpen && (
          <form onSubmit={handleAddByUrl} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <p className="text-sm text-gray-600">Paste URL gambar (mis. dari Cloudinary) untuk menambah ke Media Library.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL <span className="text-red-500">*</span></label>
              <input
                type="url"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama file (opsional)</label>
              <input
                type="text"
                value={addFilename}
                onChange={(e) => setAddFilename(e.target.value)}
                placeholder="article-03.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            {addUrlError && <p className="text-sm text-red-600">{addUrlError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addingUrl}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {addingUrl ? 'Menambah...' : 'Tambah'}
              </button>
              <button
                type="button"
                onClick={() => { setAddUrlOpen(false); setAddUrlError(null); }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Batal
              </button>
            </div>
          </form>
        )}
        <p className="text-xs text-gray-500">
          Jika muncul &quot;Upload preset not found&quot;, buat preset di Cloudinary: Settings → Upload → Add upload preset, nama <strong>{uploadPreset}</strong>, Signing mode: <strong>Unsigned</strong>. Untuk <strong>Import dari Cloudinary</strong> butuh API Key &amp; Secret di .env: <code className="bg-gray-100 px-1 rounded">CLOUDINARY_API_KEY</code>, <code className="bg-gray-100 px-1 rounded">CLOUDINARY_API_SECRET</code>.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat media...</div>
      ) : mediaList.length === 0 ? (
        <div className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-200">
          Belum ada media. Upload file untuk menambah.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mediaList.map((item) => (
            <div
              key={item.id}
              className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden relative group"
            >
              <div className="aspect-video bg-gray-200 relative">
                {item.cloudinaryId ? (
                  <CldImage
                    src={item.cloudinaryId}
                    width={400}
                    height={225}
                    alt={item.filename}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-full object-contain"
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  disabled={deletingId === item.id}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  title="Hapus dari Media Library"
                >
                  <IconTrash size={18} />
                </button>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-sm font-medium text-gray-900 truncate" title={item.filename}>
                  {item.filename}
                </p>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    readOnly
                    value={item.url}
                    className="flex-1 min-w-0 text-xs text-gray-600 bg-white border border-gray-200 rounded px-2 py-1.5 truncate"
                  />
                  <button
                    type="button"
                    onClick={() => copyUrl(item.url, item.id)}
                    className="shrink-0 p-1.5 rounded border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Salin URL"
                  >
                    {copiedId === item.id ? (
                      <IconCheck size={16} className="text-green-600" />
                    ) : (
                      <IconCopy size={16} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Gunakan URL ini di Article, Promo, Banner, dll.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


