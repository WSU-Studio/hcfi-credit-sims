'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react';

export type Media = {
  id: string;
  filename: string;
  url: string;
  cloudinaryId: string | null;
  width: number | null;
  height: number | null;
};

type MediaPickerProps = {
  onSelect: (media: Media | null) => void;
  /** Current image URL - used to highlight selected item in gallery */
  value?: string | null;
  currentMediaId?: string | null;
  compact?: boolean;
};

export function MediaPicker({ onSelect, value, currentMediaId, compact = true }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/media')
      .then((res) => res.json())
      .then((data) => setMedia(data.media || []))
      .catch(() => setMedia([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open) {
      loadMedia();
      setUploadError(null);
    }
  }, [open, loadMedia]);

  const handleSelect = (item: Media) => {
    onSelect(item);
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setOpen(false);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    fetch('/api/admin/media/upload', { method: 'POST', body: formData })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        loadMedia();
        if (data.media) {
          onSelect(data.media);
          setOpen(false);
        }
      })
      .catch((err) => setUploadError(err?.message ?? 'Gagal upload'))
      .finally(() => {
        setUploading(false);
        e.target.value = '';
      });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center rounded-lg border-2 border-gray-300 hover:border-[#008AEC] hover:bg-gray-50 transition-colors shrink-0 ${
          compact ? 'h-10 w-10' : 'h-10 px-3 gap-2'
        }`}
        title="Pilih atau upload gambar"
      >
        <IconPhoto size={20} className="text-gray-600" />
        {!compact && <span className="text-sm font-medium text-gray-700">Pilih gambar</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="media-picker-title"
        >
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 id="media-picker-title" className="text-lg font-semibold text-gray-900">
                Pilih gambar
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                aria-label="Tutup"
              >
                <IconX size={22} />
              </button>
            </div>

            {/* Upload area */}
            <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#008AEC] text-white rounded-lg hover:bg-[#0077d1] transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  <IconUpload size={18} />
                  {uploading ? 'Mengunggah...' : 'Upload gambar baru'}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                >
                  Hapus pilihan
                </button>
              </div>
              {uploadError && (
                <p className="mt-2 text-sm text-red-600">{uploadError}</p>
              )}
            </div>

            {/* Gallery grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-12 text-gray-500">Memuat media...</div>
              ) : media.length === 0 ? (
                <div className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-200">
                  Belum ada gambar. Upload file untuk menambah, atau gunakan URL manual di field di sebelah.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {media.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`relative aspect-video rounded-lg border-2 overflow-hidden transition-all hover:ring-2 hover:ring-[#008AEC] focus:outline-none focus:ring-2 focus:ring-[#008AEC] ${
                        currentMediaId === item.id || value === item.url
                          ? 'border-[#008AEC] ring-2 ring-[#008AEC]'
                          : 'border-gray-200 hover:border-[#008AEC]/50'
                      }`}
                    >
                      <Image
                        src={item.url}
                        alt={item.filename}
                        fill
                        className="object-contain bg-gray-100"
                        unoptimized
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-xs text-white truncate" title={item.filename}>
                          {item.filename}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
