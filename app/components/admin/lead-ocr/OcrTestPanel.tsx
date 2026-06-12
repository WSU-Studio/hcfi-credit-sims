'use client';

import { useState } from 'react';
import {
  IconChevronDown,
  IconChevronUp,
  IconScan,
  IconRefresh,
  IconBolt,
} from '@tabler/icons-react';
import { FilePickerCard } from '@/app/components/admin/lead-ocr/FilePickerCard';
import {
  OcrResultPanel,
  type OcrTestResult,
} from '@/app/components/admin/lead-ocr/OcrResultPanel';

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Tool diagnostik OCR — admin upload file KTP, langsung hit endpoint Hyundai
 * `GetOCRKTPData` tanpa harus jalanin full flow lead submission.
 *
 * Container component (Container/Presentational pattern):
 *   - Punya state (file, loading, result, error)
 *   - Delegate render ke FilePickerCard + OcrResultPanel
 */
export function OcrTestPanel({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [file, setFile] = useState<File | null>(null);
  const [trxNo, setTrxNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OcrTestResult | null>(null);

  const reset = () => {
    setFile(null);
    setTrxNo('');
    setResult(null);
    setError(null);
  };

  const runTest = async () => {
    if (!file) {
      setError('Pilih file KTP terlebih dulu');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (trxNo.trim()) fd.append('trxNo', trxNo.trim());
      const res = await fetch('/api/admin/lead-ocr/test', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request gagal (${res.status})`);
      }
      setResult(data as OcrTestResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menjalankan tes OCR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <header
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600">
          <IconScan size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">Tes OCR KTP</h2>
          <p className="text-xs text-gray-500">
            Uji endpoint <span className="font-mono">GetOCRKTPData</span> Hyundai langsung
            dengan file gambar — tidak menyentuh data Lead.
          </p>
        </div>
        <button
          type="button"
          aria-label={open ? 'Tutup panel' : 'Buka panel'}
          className="text-gray-500 hover:text-gray-700"
        >
          {open ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
        </button>
      </header>

      {open && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <FilePickerCard
                file={file}
                onFileChange={setFile}
                maxBytes={MAX_BYTES}
                disabled={loading}
                hint="Tip: WebP otomatis di-konversi ke JPEG sebelum dikirim ke Hyundai (engine OCR mereka tidak baca WebP)."
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  trxNo (opsional)
                </label>
                <input
                  type="text"
                  value={trxNo}
                  onChange={(e) => setTrxNo(e.target.value)}
                  placeholder="Auto: TEST-XXXXXXXX"
                  disabled={loading}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono placeholder:font-sans placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 text-gray-700"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Kosongkan untuk auto-generate. Isi dengan LeadNo Hyundai kalau mau
                  korelasi log mereka (mis. <span className="font-mono">13STGLD20260600008</span>).
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={runTest}
                  disabled={loading || !file}
                  className="inline-flex items-center justify-center gap-2 flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Menjalankan…
                    </>
                  ) : (
                    <>
                      <IconBolt size={16} />
                      Jalankan tes OCR
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  title="Reset"
                >
                  <IconRefresh size={16} />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && <OcrResultPanel result={result} />}
        </div>
      )}
    </section>
  );
}
