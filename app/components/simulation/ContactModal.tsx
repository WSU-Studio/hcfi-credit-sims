'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { IconX, IconCheck } from '@tabler/icons-react';
import type { Vendor } from '@/app/types/credit-simulation';
import type { LeadSource } from '@/lib/lead-source';
import { LEAD_SOURCES } from '@/lib/lead-source';
import type { LeadAssetSnapshot } from '@/lib/lead-asset-snapshot';
import {
  emptyOcrKtpSnapshot,
  isOcrKtpSnapshotComplete,
  normalizeOcrBirthDate,
  sanitizeOcrKtpSnapshotDigits,
  type OcrKtpSnapshot,
} from '@/lib/ocr-ktp-snapshot';
import { HONEYPOT_FIELD } from '@/lib/security/honeypot';
import { HoneypotField } from '@/app/components/security/HoneypotField';
import { KtpOcrReviewForm } from '@/app/components/simulation/KtpOcrReviewForm';

export type UserLocation = { latitude: number; longitude: number } | null;

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * LeadNo Hyundai dari Step 4 (PriceStep). Akan disimpan ke `Lead.simulationLeadNo`
   * dan men-trigger update `LeadAssetDraft.convertedLeadId` di backend.
   */
  leadNo?: string | null;
  productName?: string;
  productCode?: string;
  firstInstallment?: 'ADDM' | 'ADDB';
  isPromotion?: boolean;
  otrPrice?: number;
  discount?: number;
  dpPercent?: number;
  tenor?: number;
  vehicleSummary?: string;
  assetSnapshot?: LeadAssetSnapshot | null;
  dealer?: Vendor | null;
  userLocation?: UserLocation; // Fallback jika sudah di-capture di parent
  leadSource?: LeadSource;
  onSubmit?: (data: { name: string; phone: string; email: string }) => void;
}

export function ContactModal({
  open,
  onClose,
  leadNo,
  productName,
  productCode,
  firstInstallment,
  isPromotion,
  otrPrice,
  discount,
  dpPercent,
  tenor,
  vehicleSummary,
  assetSnapshot,
  dealer,
  userLocation,
  leadSource = LEAD_SOURCES.WEBSITE,
  onSubmit,
}: ContactModalProps) {
  const t = useTranslations('creditSimulation');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
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
  const [homeOwnership, setHomeOwnership] = useState<string>('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [modalLocation, setModalLocation] = useState<UserLocation>(null);
  const [honeypot, setHoneypot] = useState<string>('');

  // Request geolocation when modal opens (setelah user click Contact = ada user gesture).
  // The server derives the IP from request headers and intentionally ignores any
  // client-supplied value to prevent spoofing.
  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    if (navigator.geolocation) {
      if (userLocation) {
        setModalLocation(userLocation);
        return;
      }
      setModalLocation(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setModalLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => setModalLocation(null),
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      );
    }
  }, [open, userLocation]);

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

  useEffect(() => {
    if (!open) {
      setName('');
      setPhone('');
      setEmail('');
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
      setSuccess(false);
      setError(null);
      setPhoneTouched(false);
      setEmailTouched(false);
      setModalLocation(null);
      setHoneypot('');
    }
  }, [open]);

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
        ? t('phoneRequired')
        : isPhoneValid
          ? null
          : t('invalidPhone')
      : null;
  const emailErrorText =
    emailTouched || emailTrimmed.length > 0
      ? emailTrimmed.length === 0
        ? t('emailRequired')
        : isEmailValid
          ? null
          : t('invalidEmail')
      : null;
  const isOcrComplete = isOcrKtpSnapshotComplete(ocrSnapshot);
  const isFormComplete =
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
    consent;

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
        throw new Error(data.error || t('ocrFailedGeneric'));
      }

      const category = String(data.category ?? '');
      const snapshot = sanitizeOcrKtpSnapshotDigits(
        (data.snapshot as OcrKtpSnapshot | undefined) ?? emptyOcrKtpSnapshot()
      );
      setOcrSnapshot(snapshot);
      setOcrDraft(snapshot);
      setOcrDraftShowErrors(false);
      setShowOcrForm(true);

      if (category === 'SUCCESS' || category === 'EMPTY_READ') {
        if (!name.trim() && snapshot.nama.trim()) {
          setName(snapshot.nama.trim());
        }
        if (snapshot.mrNationalityCode === 'FOREIGNER') {
          setCitizenType('FOREIGNER');
        } else if (snapshot.mrNationalityCode === 'LOCAL') {
          setCitizenType('LOCAL');
        }
      }

      if (category === 'EMPTY_READ') {
        setOcrError(data.userMessage || t('ocrEmptyReadHint'));
      } else if (category !== 'SUCCESS') {
        setOcrError(
          data.userMessage || data.errorMessage || t('ocrFailedGeneric')
        );
      }
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : t('ocrFailedGeneric'));
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

    if (!name.trim() || !phone.trim() || !email.trim() || !ktpUrl || !motherName.trim() || !homeOwnership) {
      setPhoneTouched(true);
      setEmailTouched(true);
      setError(t('pleaseFillAll'));
      return;
    }

    if (!isOcrKtpSnapshotComplete(ocrSnapshot)) {
      setError(t('ocrIncomplete'));
      setOcrDraft(ocrSnapshot);
      setShowOcrForm(true);
      return;
    }

    if (!isEmailValid) {
      setEmailTouched(true);
      setError(t('invalidEmail'));
      return;
    }

    if (!isPhoneValid) {
      setPhoneTouched(true);
      setError(t('invalidPhone'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          simulationLeadNo: leadNo || null,
          productName: productName || null,
          productCode: productCode || null,
          firstInstallment: firstInstallment ?? 'ADDM',
          isPromotion: Boolean(isPromotion),
          vehicleSummary: vehicleSummary || null,
          assetSnapshot: assetSnapshot || null,
          vendorCode: dealer?.VendorCode ?? null,
          vendorName: dealer?.VendorName ?? null,
          vendorCity: dealer?.City ?? null,
          oriOfficeCode: dealer?.OriOfficeCode ?? null,
          oriOfficeName: dealer?.OriOfficeName ?? null,
          otrPrice: otrPrice || null,
          discount: discount != null && discount > 0 ? discount : null,
          dpPercent: dpPercent || null,
          tenor: tenor || null,
          ktpUrl,
          ocrSnapshot: {
            ...ocrSnapshot,
            nama: ocrSnapshot.nama.trim() || name.trim(),
            mrNationalityCode:
              ocrSnapshot.mrNationalityCode ||
              (citizenType === 'FOREIGNER' ? 'FOREIGNER' : 'LOCAL'),
          },
          citizenType,
          motherName: motherName.trim() || null,
          homeOwnershipStatus: homeOwnership || null,
          consentAccepted: consent,
          latitude: (modalLocation ?? userLocation)?.latitude ?? null,
          longitude: (modalLocation ?? userLocation)?.longitude ?? null,
          source: leadSource,
          [HONEYPOT_FIELD]: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Prioritaskan `message` (lebih user-friendly, mis. "Sesi simulasi
        // tidak valid. Silakan ulangi simulasi kredit.") sebelum fallback ke
        // `error` yang biasanya berisi kode generik ("Invalid input").
        throw new Error(data.message || data.error || t('submitError'));
      }

      setSuccess(true);
      onSubmit?.({ name: name.trim(), phone: phone.trim(), email: email.trim() });
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('submitError'));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-white sm:bg-black/50" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-4xl rounded-xl bg-white sm:shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="contact-title" className="text-lg font-semibold text-gray-900">
            {t('contactModalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label={t('close')}
          >
            <IconX size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <HoneypotField value={honeypot} onChange={setHoneypot} />
          {(productName || vehicleSummary || dealer) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              {productName && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Produk:</span> {productName}
                </p>
              )}
              {vehicleSummary && (
                <p className="mt-1 text-xs text-gray-600">
                  <span className="font-medium">Kendaraan:</span> {vehicleSummary}
                </p>
              )}
              {dealer && (
                <p className="mt-1 text-xs text-gray-600">
                  <span className="font-medium">Dealer:</span> {dealer.City}, {dealer.VendorName}
                </p>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('fullName')} <span className="text-red-500">*</span>
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading || success}
                className="w-full px-4 h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder={t('fullNamePlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('phone')} <span className="text-red-500">*</span>
              </label>
              <input
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setPhoneTouched(true)}
                required
                disabled={loading || success}
                className={`w-full px-4 h-11 border rounded-lg outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
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
              <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('email')} <span className="text-red-500">*</span>
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                required
                disabled={loading || success}
                className={`w-full px-4 h-11 border rounded-lg outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
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

          <div className="pt-2 space-y-3 border-t border-gray-200 mt-2">
            <p className="text-sm font-semibold text-gray-900">
              {t('creditScoringSectionTitle')}
            </p>
            <p className="text-xs text-gray-500">
              {t('creditScoringSectionHint')}
            </p>

            <div className="mb-4 mt-2">
              <p className="text-sm font-medium text-gray-700 mb-1">
                {t('citizenTypeLabel')}
              </p>
              <div className="flex gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="citizenType"
                    value="LOCAL"
                    checked={citizenType === 'LOCAL'}
                    onChange={() => setCitizenType('LOCAL')}
                    disabled={loading || success}
                    className="w-4 h-4 text-[#002c5f] border-gray-300 focus:ring-[#002c5f] disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-700">{t('citizenTypeLocal')}</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="citizenType"
                    value="FOREIGNER"
                    checked={citizenType === 'FOREIGNER'}
                    onChange={() => setCitizenType('FOREIGNER')}
                    disabled={loading || success}
                    className="w-4 h-4 text-[#002c5f] border-gray-300 focus:ring-[#002c5f] disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-700">{t('citizenTypeForeigner')}</span>
                </label>
              </div>
            </div>

            <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {citizenType === 'FOREIGNER' ? t('ktpUploadLabelForeigner') : t('ktpUploadLabel')}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    className={`inline-flex items-center h-11 px-4 rounded-lg bg-[#002c5f] text-white text-sm font-medium cursor-pointer transition-colors ${
                      ktpUploading || ocrLoading || loading || success
                        ? 'opacity-50 cursor-not-allowed pointer-events-none'
                        : 'hover:bg-[#002c5f]/90'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleKtpChange}
                      disabled={ktpUploading || ocrLoading || loading || success}
                      className="sr-only"
                    />
                    {t('browse')}
                  </label>
                  <span className={`text-sm ${ktpUrl ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                    {ktpUploading
                      ? t('ktpUploading')
                      : ocrLoading
                        ? t('ocrProcessing')
                        : ktpUrl && ktpFileName
                          ? ktpFileName
                          : t('noFileSelected')}
                  </span>
                </div>
                {(ktpUploading || ocrLoading) && (
                  <p className="mt-1 text-xs text-gray-500">
                    {ktpUploading ? t('ktpUploading') : t('ocrProcessing')}
                  </p>
                )}
                {ktpUrl && !ktpUploading && !ocrLoading && (
                  <p className="mt-1 text-xs text-green-600">
                    {t('ktpUploadSuccess')}
                  </p>
                )}
                {ktpError && (
                  <p className="mt-1 text-xs text-red-600">{ktpError}</p>
                )}
                {ocrError && (
                  <p className="mt-1 text-xs text-amber-700">{ocrError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {t('ktpUploadHint')}
                </p>
                {ktpUrl && !ocrLoading && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (showOcrForm) {
                          setShowOcrForm(false);
                          return;
                        }
                        handleOpenOcrModal();
                      }}
                      className="text-xs font-medium text-[#002c5f] hover:text-[#002c5f]/80 cursor-pointer border border-gray-300 rounded-lg px-2 py-1"
                    >
                      {showOcrForm ? t('ocrHideData') : t('ocrShowData')}
                    </button>
                    <span className={`text-xs font-medium ${isOcrComplete ? 'text-green-600' : 'text-red-600'}`}>
                      {isOcrComplete ? t('ocrStatusComplete') : t('ocrStatusIncomplete')}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="mother-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('motherNameLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="mother-name"
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  required
                  disabled={loading || success}
                  className="w-full px-4 h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder={t('motherNamePlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="home-ownership" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('homeOwnershipLabel')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="home-ownership"
                  value={homeOwnership}
                  onChange={(e) => setHomeOwnership(e.target.value)}
                  required
                  disabled={loading || success}
                  className="w-full h-11 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                >
                  <option value="">{t('homeOwnershipPlaceholder')}</option>
                  <option value="OWN">{t('homeOwnershipOwn')}</option>
                  <option value="FAMILY">{t('homeOwnershipFamily')}</option>
                  <option value="RENT">{t('homeOwnershipRent')}</option>
                  <option value="COMPANY">{t('homeOwnershipCompany')}</option>
                  <option value="OTHER">{t('homeOwnershipOther')}</option>
                </select>
              </div>
            </div>

          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-gray-600">
            <input
              id="consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={loading || success}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#002c5f] focus:ring-[#002c5f] disabled:opacity-50"
            />
            <label htmlFor="consent" className="cursor-pointer">
              {t('consentLabel')}
            </label>
          </div>

          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
              <IconCheck size={18} />
              <span>{t('success')}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || success || !isFormComplete}
              className="flex-1 px-4 py-2.5 bg-[#002c5f] text-white rounded-lg font-medium hover:bg-[#002c5f]/90 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? t('sending') : success ? t('success') : t('submitContact')}
            </button>
          </div>
        </form>
      </div>

      {showOcrForm && ktpUrl && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t('close')}
            onClick={() => setShowOcrForm(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('ocrReviewTitle')}
            className="relative z-10 w-full max-w-5xl rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">{t('ocrReviewTitle')}</h3>
              <button
                type="button"
                onClick={() => setShowOcrForm(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                aria-label={t('close')}
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
                <p className="mt-3 text-xs text-red-600">{t('ocrSaveBlocked')}</p>
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
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveOcrDraft}
                disabled={loading || success}
                className="px-4 py-2 text-sm font-medium text-white bg-[#002c5f] rounded-lg hover:bg-[#002c5f]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('ocrSaveData')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
