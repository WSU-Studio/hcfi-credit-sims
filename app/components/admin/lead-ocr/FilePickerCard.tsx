'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { IconUpload, IconX, IconPhoto } from '@tabler/icons-react';

type FilePickerCardProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  maxBytes?: number;
  disabled?: boolean;
  hint?: string;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Drag-and-drop image picker yang menampilkan preview file terpilih.
 * Single-responsibility: hanya soal pilih file & preview, tidak tahu apa-apa
 * soal endpoint/API yang akan menerima file.
 */
export function FilePickerCard({
  file,
  onFileChange,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  maxBytes = 10 * 1024 * 1024,
  disabled = false,
  hint,
}: FilePickerCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const acceptFile = useCallback(
    (next: File | null) => {
      if (!next) {
        onFileChange(null);
        setLocalError(null);
        return;
      }
      if (!next.type.startsWith('image/')) {
        setLocalError('Hanya file gambar yang didukung');
        return;
      }
      if (next.size > maxBytes) {
        setLocalError(`Ukuran file maksimal ${formatBytes(maxBytes)}`);
        return;
      }
      setLocalError(null);
      onFileChange(next);
    },
    [maxBytes, onFileChange]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    acceptFile(next);
    // Reset agar memilih file yang sama lagi tetap memicu onChange.
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    const next = e.dataTransfer.files?.[0] ?? null;
    acceptFile(next);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-colors ${
          disabled
            ? 'opacity-60 pointer-events-none bg-gray-50 border-gray-200'
            : dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/40'
        }`}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onInputChange}
          disabled={disabled}
        />

        {previewUrl && file ? (
          <div className="flex items-center gap-4 p-4">
            <div className="shrink-0 w-24 h-24 bg-gray-100 border border-gray-200 rounded-md overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview KTP" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {file.type || 'unknown'} · {formatBytes(file.size)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Klik area ini untuk ganti file</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
                setLocalError(null);
              }}
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              aria-label="Hapus file"
            >
              <IconX size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              {dragActive ? <IconPhoto size={22} /> : <IconUpload size={22} />}
            </div>
            <p className="text-sm font-medium text-gray-700">
              {dragActive ? 'Lepas file di sini' : 'Klik atau seret file KTP ke area ini'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, WebP, atau GIF · maks {formatBytes(maxBytes)}
            </p>
          </div>
        )}
      </div>
      {hint && !localError && <p className="text-xs text-gray-500 mt-2">{hint}</p>}
      {localError && <p className="text-xs text-red-600 mt-2">{localError}</p>}
    </div>
  );
}
