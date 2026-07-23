'use client';

import { useEffect, useMemo, useState } from 'react';
import { IconCheck, IconX } from '@tabler/icons-react';
import {
  emptyOcrKtpSnapshot,
  isOcrKtpSnapshotComplete,
  normalizeOcrBirthDate,
  sanitizeOcrKtpSnapshotDigits,
  type OcrKtpSnapshot,
} from '@/lib/ocr-ktp-snapshot';
import {
  CreditScoringFields,
  type CreditScoringLabels,
} from '@/app/components/simulation/CreditScoringFields';
import { KtpOcrReviewForm } from '@/app/components/simulation/KtpOcrReviewForm';

const LABELS: CreditScoringLabels = {
  sectionTitle: 'Data tambahan untuk proses credit scoring',
  sectionHint: 'Semua field di bawah wajib diisi untuk melengkapi pengajuan lead.',
  citizenTypeLabel: 'Jenis pemohon',
  citizenTypeLocal: 'Warga Negara Indonesia (WNI)',
  citizenTypeForeigner: 'Warga Negara Asing (WNA)',
  ktpUploadLabel: 'Upload foto KTP',
  ktpUploadLabelForeigner: 'Upload ID Card / KITAS / Passport',
  browse: 'Pilih file...',
  noFileSelected: 'Belum ada file dipilih.',
  ktpUploading: 'Sedang mengunggah foto KTP...',
  ktpUploadSuccess: 'Foto KTP berhasil diunggah.',
  ktpUploadHint: 'Format JPG/PNG/WEBP, foto jelas dan tidak blur.',
  ocrProcessing: 'Membaca data KTP...',
  ocrShowData: 'Lihat & periksa data KTP',
  ocrHideData: 'Sembunyikan data KTP',
  ocrStatusComplete: 'Data sudah lengkap',
  ocrStatusIncomplete: 'Data masih belum lengkap',
  motherNameLabel: 'Nama ibu kandung',
  motherNamePlaceholder: 'Masukkan nama ibu kandung',
  homeOwnershipLabel: 'Status kepemilikan rumah / bangunan tempat tinggal',
  homeOwnershipPlaceholder: 'Pilih status kepemilikan',
  homeOwnershipOwn: 'Milik sendiri',
  homeOwnershipFamily: 'Milik orang tua / keluarga',
  homeOwnershipRent: 'Kontrak / sewa',
  homeOwnershipCompany: 'Fasilitas perusahaan',
  homeOwnershipOther: 'Lainnya',
};

interface CompleteLeadScoringModalProps {
  open: boolean;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Admin modal to complete credit-scoring fields for leads submitted without Fast Track.
 * Shows the full contact form (name/phone/email) so admin can edit contact details too.
 */
export function CompleteLeadScoringModal({
  open,
  leadId,
  leadName,
  leadPhone,
  leadEmail,
  onClose,
  onSaved,
}: CompleteLeadScoringModalProps) {
  const [name, setName] = useState(leadName);
  const [phone, setPhone] = useState(leadPhone);
  const [email, setEmail] = useState(leadEmail);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [ktpUrl, setKtpUrl] = useState<string | null>(null);
  const [ktpFileName, setKtpFileName] = useState<string | null>(null);
  const [ktpUploading, setKtpUploading] = useState(false);
  const [ktpError, setKtpError] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrDraftShowErrors, setOcrDraftShowErrors] = useState(false);
  const [ocrSnapshot, setOcrSnapshot] = useState<OcrKtpSnapshot>(emptyOcrKtpSnapshot);
  const [ocrDraft, setOcrDraft] = useState<OcrKtpSnapshot>(emptyOcrKtpSnapshot);
  const [showOcrForm, setShowOcrForm] = useState(false);
  const [citizenType, setCitizenType] = useState<'LOCAL' | 'FOREIGNER'>('LOCAL');
  const [motherName, setMotherName] = useState('');
  const [homeOwnership, setHomeOwnership] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync contact fields whenever the modal opens or the lead identity changes.
  useEffect(() => {
    if (!open) return;
    setName(leadName);
    setPhone(leadPhone);
    setEmail(leadEmail);
    setPhoneTouched(false);
    setEmailTouched(false);
    setKtpUrl(null);
    setKtpFileName(null);
    setKtpUploading(false);
    setKtpError(null);
    setOcrLoading(false);
    setOcrError(null);
    setOcrDraftShowErrors(false);
    setOcrSnapshot(emptyOcrKtpSnapshot());
    setOcrDraft(emptyOcrKtpSnapshot());
    setShowOcrForm(false);
    setCitizenType('LOCAL');
    setMotherName('');
    setHomeOwnership('');
    setConsent(false);
    setLoading(false);
    setSuccess(false);
    setError(null);
  }, [open, leadId, leadName, leadPhone, leadEmail]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showOcrForm) {
        setShowOcrForm(false);
        return;
      }
      onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose, showOcrForm]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9+\-\s()]+$/;
  const phoneDigits = phone.replace(/\D/g, '');
  const phoneTrimmed = phone.trim();
  const emailTrimmed = email.trim();
  const isPhoneValid = phoneRegex.test(phone) && phoneDigits.length >= 10;
  const isEmailValid = emailRegex.test(email);
  const phoneErrorText =
    phoneTouched || phoneTrimmed.length > 0
      ? phoneTrimmed.length === 0
        ? 'Nomor telepon wajib diisi'
        : isPhoneValid
          ? null
          : 'Format nomor telepon tidak valid'
      : null;
  const emailErrorText =
    emailTouched || emailTrimmed.length > 0
      ? emailTrimmed.length === 0
        ? 'Email wajib diisi'
        : isEmailValid
          ? null
          : 'Format email tidak valid'
      : null;

  const isOcrComplete = isOcrKtpSnapshotComplete(ocrSnapshot);
  const isFormComplete = useMemo(
    () =>
      name.trim().length > 0 &&
      phoneTrimmed.length > 0 &&
      isPhoneValid &&
      emailTrimmed.length > 0 &&
      isEmailValid &&
      Boolean(ktpUrl) &&
      !ktpUploading &&
      !ocrLoading &&
      isOcrComplete &&
      motherName.trim().length > 0 &&
      homeOwnership.length > 0 &&
      consent,
    [
      name,
      phoneTrimmed,
      isPhoneValid,
      emailTrimmed,
      isEmailValid,
      ktpUrl,
      ktpUploading,
      ocrLoading,
      isOcrComplete,
      motherName,
      homeOwnership,
      consent,
    ]
  );

  const runKtpOcr = async (file: File) => {
    setOcrLoading(true);
    setOcrError(null);
    setOcrSnapshot(emptyOcrKtpSnapshot());
    setOcrDraft(emptyOcrKtpSnapshot());
    setShowOcrForm(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/leads/ocr-ktp', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membaca data KTP');
      }

      const category = String(data.category ?? '');
      const snapshot = sanitizeOcrKtpSnapshotDigits(
        (data.snapshot as OcrKtpSnapshot | undefined) ?? emptyOcrKtpSnapshot()
      );
      setOcrSnapshot(snapshot);
      setOcrDraft(snapshot);
      setOcrDraftShowErrors(false);
      setShowOcrForm(true);

      if (snapshot.mrNationalityCode === 'FOREIGNER') {
        setCitizenType('FOREIGNER');
      } else if (snapshot.mrNationalityCode === 'LOCAL') {
        setCitizenType('LOCAL');
      }
      if (!name.trim() && snapshot.nama.trim()) {
        setName(snapshot.nama.trim());
      }

      if (category === 'EMPTY_READ') {
        setOcrError(data.userMessage || 'Foto KTP belum bisa dibaca. Unggah ulang foto yang lebih jelas.');
      } else if (category !== 'SUCCESS') {
        setOcrError(data.userMessage || data.errorMessage || 'Gagal membaca data KTP');
      }
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'Gagal membaca data KTP');
      setShowOcrForm(true);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleOpenOcrModal = () => {
    setOcrDraft(sanitizeOcrKtpSnapshotDigits(ocrSnapshot));
    setOcrDraftShowErrors(false);
    setShowOcrForm(true);
  };

  const handleSaveOcrDraft = () => {
    const cleaned = sanitizeOcrKtpSnapshotDigits(ocrDraft);
    const birthNormalized = normalizeOcrBirthDate(cleaned.tanggalLahir);
    const next: OcrKtpSnapshot = {
      ...cleaned,
      tanggalLahir: birthNormalized ?? cleaned.tanggalLahir.trim(),
    };

    if (!isOcrKtpSnapshotComplete(next)) {
      setOcrDraft(next);
      setOcrDraftShowErrors(true);
      return;
    }

    setOcrSnapshot(next);
    setOcrDraft(next);
    setOcrDraftShowErrors(false);
    setShowOcrForm(false);
  };

  const handleKtpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setKtpError(null);
    setOcrError(null);
    setKtpUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/leads/upload-ktp', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload gagal');
      }
      setKtpUrl(data.url);
      setKtpFileName(file.name);
      await runKtpOcr(file);
    } catch (err) {
      setKtpError(err instanceof Error ? err.message : 'Upload gagal');
    } finally {
      setKtpUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim() || !email.trim() || !ktpUrl || !motherName.trim() || !homeOwnership || !consent) {
      setPhoneTouched(true);
      setEmailTouched(true);
      setError('Mohon lengkapi semua field');
      return;
    }
    if (!isEmailValid) {
      setEmailTouched(true);
      setError('Format email tidak valid');
      return;
    }
    if (!isPhoneValid) {
      setPhoneTouched(true);
      setError('Format nomor telepon tidak valid');
      return;
    }
    if (!isOcrKtpSnapshotComplete(ocrSnapshot)) {
      setError('Lengkapi data KTP sebelum menyimpan.');
      setOcrDraft(ocrSnapshot);
      setShowOcrForm(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}/complete-scoring`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          ktpUrl,
          ocrSnapshot: {
            ...ocrSnapshot,
            nama: ocrSnapshot.nama.trim() || name.trim(),
            mrNationalityCode:
              ocrSnapshot.mrNationalityCode ||
              (citizenType === 'FOREIGNER' ? 'FOREIGNER' : 'LOCAL'),
          },
          citizenType,
          motherName: motherName.trim(),
          homeOwnershipStatus: homeOwnership,
          consentAccepted: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Gagal menyimpan data');
      }
      setSuccess(true);
      onSaved();
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-scoring-title"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-4xl rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 id="complete-scoring-title" className="text-lg font-semibold text-gray-900">
              Lengkapi Data Credit Scoring
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Edit data kontak dan lengkapi field credit scoring.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Tutup"
          >
            <IconX size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-black">
          <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
            <div>
              <label htmlFor="complete-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nama lengkap <span className="text-red-500">*</span>
              </label>
              <input
                id="complete-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading || success}
                className="w-full px-4 h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div>
              <label htmlFor="complete-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Telepon <span className="text-red-500">*</span>
              </label>
              <input
                id="complete-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setPhoneTouched(true)}
                required
                disabled={loading || success}
                className={`w-full px-4 h-11 border rounded-lg outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-black ${
                  phoneErrorText
                    ? 'border-red-400 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f]'
                }`}
                placeholder="081234567890"
              />
              {phoneErrorText && (
                <p className="mt-1 text-xs text-red-600">* {phoneErrorText}</p>
              )}
            </div>

            <div>
              <label htmlFor="complete-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="complete-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                required
                disabled={loading || success}
                className={`w-full px-4 h-11 border rounded-lg outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-black ${
                  emailErrorText
                    ? 'border-red-400 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f]'
                }`}
                placeholder="nama@email.com"
              />
              {emailErrorText && (
                <p className="mt-1 text-xs text-red-600">* {emailErrorText}</p>
              )}
            </div>
          </div>

          <CreditScoringFields
            labels={LABELS}
            citizenType={citizenType}
            onCitizenTypeChange={setCitizenType}
            ktpUrl={ktpUrl}
            ktpFileName={ktpFileName}
            ktpUploading={ktpUploading}
            ktpError={ktpError}
            ocrLoading={ocrLoading}
            ocrError={ocrError}
            isOcrComplete={isOcrComplete}
            showOcrForm={showOcrForm}
            onToggleOcrForm={() => {
              if (showOcrForm) {
                setShowOcrForm(false);
                return;
              }
              handleOpenOcrModal();
            }}
            onKtpChange={handleKtpChange}
            motherName={motherName}
            onMotherNameChange={setMotherName}
            homeOwnership={homeOwnership}
            onHomeOwnershipChange={setHomeOwnership}
            disabled={loading || success}
          />

          <div className="flex items-start gap-2 text-xs text-gray-600">
            <input
              id="complete-scoring-consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={loading || success}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#002c5f] focus:ring-[#002c5f] disabled:opacity-50"
            />
            <label htmlFor="complete-scoring-consent" className="cursor-pointer">
              Saya setuju data yang diisi (termasuk foto KTP) digunakan untuk proses analisa kelayakan
              kredit sesuai ketentuan perlindungan data yang berlaku.
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
              <IconCheck size={18} />
              <span>Data credit scoring berhasil disimpan.</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || success || !isFormComplete}
              className="flex-1 px-4 py-2.5 bg-[#002c5f] text-white rounded-lg font-medium hover:bg-[#002c5f]/90 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : success ? 'Tersimpan' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>

      {showOcrForm && ktpUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => setShowOcrForm(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Data KTP"
            className="relative z-10 w-full max-w-5xl rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Data KTP (hasil pembacaan)</h3>
              <button
                type="button"
                onClick={() => setShowOcrForm(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                aria-label="Tutup"
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto p-4">
              <KtpOcrReviewForm
                value={ocrDraft}
                onChange={setOcrDraft}
                disabled={loading || success}
                showErrors={ocrDraftShowErrors}
              />
              {ocrDraftShowErrors && !isOcrKtpSnapshotComplete(ocrDraft) && (
                <p className="mt-3 text-xs text-red-600">
                  Perbaiki data yang belum valid sebelum menyimpan.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setShowOcrForm(false);
                  setOcrDraftShowErrors(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveOcrDraft}
                disabled={loading || success}
                className="px-4 py-2 text-sm font-medium text-white bg-[#002c5f] rounded-lg hover:bg-[#002c5f]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Simpan data KTP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
