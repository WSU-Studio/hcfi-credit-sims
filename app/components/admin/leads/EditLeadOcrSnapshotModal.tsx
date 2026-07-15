'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { IconX } from '@tabler/icons-react';
import { KtpOcrReviewForm } from '@/app/components/simulation/KtpOcrReviewForm';
import {
  coerceOcrKtpSnapshot,
  emptyOcrKtpSnapshot,
  isOcrKtpSnapshotComplete,
  normalizeOcrBirthDate,
  sanitizeOcrKtpSnapshotDigits,
  type OcrKtpSnapshot,
} from '@/lib/ocr-ktp-snapshot';
import idMessages from '@/messages/id.json';

type EditLeadOcrSnapshotModalProps = {
  open: boolean;
  leadId: string;
  leadName?: string | null;
  initialSnapshot?: unknown;
  onClose: () => void;
  onSaved: (snapshot: OcrKtpSnapshot) => void;
};

function snapshotHasAnyData(snapshot: OcrKtpSnapshot): boolean {
  return Object.values(snapshot).some((v) => String(v ?? '').trim().length > 0);
}

export function EditLeadOcrSnapshotModal({
  open,
  leadId,
  leadName,
  initialSnapshot,
  onClose,
  onSaved,
}: EditLeadOcrSnapshotModalProps) {
  const [draft, setDraft] = useState<OcrKtpSnapshot>(emptyOcrKtpSnapshot);
  const [showErrors, setShowErrors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const fromProp = coerceOcrKtpSnapshot(initialSnapshot);
    setDraft(fromProp);
    setShowErrors(false);
    setError(null);

    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/leads/${encodeURIComponent(leadId)}/ocr-snapshot`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memuat data KTP');
        if (cancelled) return;

        const fresh = coerceOcrKtpSnapshot(data.ocrSnapshot);
        // Jangan timpa data prop yang valid dengan hasil kosong (parse/API glitch).
        if (snapshotHasAnyData(fresh) || !snapshotHasAnyData(fromProp)) {
          setDraft(fresh);
        }
        if (!snapshotHasAnyData(fresh) && !snapshotHasAnyData(fromProp)) {
          setError(
            'Snapshot OCR lead ini masih kosong. Isi manual dari foto KTP, lalu simpan.'
          );
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat data KTP');
          // Tetap pakai data awal dari list leads jika ada.
          if (snapshotHasAnyData(fromProp)) {
            setDraft(fromProp);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // sengaja tidak depend ke initialSnapshot (object identity berubah tiap render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, saving, onClose]);

  if (!open) return null;

  const handleSave = async () => {
    const cleaned = sanitizeOcrKtpSnapshotDigits(draft);
    const birth = normalizeOcrBirthDate(cleaned.tanggalLahir);
    const next: OcrKtpSnapshot = {
      ...cleaned,
      tanggalLahir: birth ?? cleaned.tanggalLahir.trim(),
    };

    if (!isOcrKtpSnapshotComplete(next)) {
      setDraft(next);
      setShowErrors(true);
      setError('Perbaiki data yang belum valid sebelum menyimpan.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}/ocr-snapshot`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocrSnapshot: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data KTP');
      onSaved(next);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data KTP');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={() => {
          if (!saving) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-ocr-title"
        className="relative z-10 w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl bg-white text-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 shrink-0">
          <div>
            <h3 id="edit-ocr-title" className="text-sm font-semibold text-gray-900">
              Edit data KTP (OCR snapshot)
            </h3>
            {leadName && (
              <p className="text-xs text-gray-500 mt-0.5">Lead: {leadName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!saving) onClose();
            }}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Tutup"
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1 min-h-0">
          <p className="mb-3 text-xs text-gray-600">
            Koreksi data lokasi (kode pos, kota, kecamatan, kelurahan) di sini, lalu
            simpan dan klik <span className="font-semibold">SUBMIT</span> lagi.
            Perubahan hanya memengaruhi lead yang belum terkirim ke Confins.
          </p>

          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">Memuat data KTP…</div>
          ) : (
            <NextIntlClientProvider locale="id" messages={idMessages}>
              <KtpOcrReviewForm
                value={draft}
                onChange={setDraft}
                disabled={saving}
                showErrors={showErrors}
              />
            </NextIntlClientProvider>
          )}

          {error && (
            <p className="mt-3 text-xs text-red-600">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!saving) onClose();
            }}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#002c5f] rounded-lg hover:bg-[#002c5f]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan…' : 'Simpan data KTP'}
          </button>
        </div>
      </div>
    </div>
  );
}
