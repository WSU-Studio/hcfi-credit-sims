'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  getOcrKtpFieldErrors,
  normalizeOcrBirthDate,
  type OcrKtpFieldErrorKey,
  type OcrKtpSnapshot,
} from '@/lib/ocr-ktp-snapshot';

type KtpOcrReviewFormProps = {
  value: OcrKtpSnapshot;
  onChange: (next: OcrKtpSnapshot) => void;
  disabled?: boolean;
  /** Tampilkan error wajib/format (mis. setelah klik Simpan). */
  showErrors?: boolean;
};

const inputClass =
  'w-full px-3 h-10 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed';

const inputErrorClass =
  'w-full px-3 h-10 border border-red-400 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed';

const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

function Field({
  id,
  label,
  hint,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-0.5 text-[10px] text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-0.5 text-[10px] text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function KtpOcrReviewForm({
  value,
  onChange,
  disabled = false,
  showErrors = false,
}: KtpOcrReviewFormProps) {
  const t = useTranslations('creditSimulation');
  const [touched, setTouched] = useState<Partial<Record<keyof OcrKtpSnapshot, boolean>>>({});

  const fieldErrors = useMemo(() => getOcrKtpFieldErrors(value), [value]);

  const errorText = (key: keyof OcrKtpSnapshot): string | undefined => {
    if (!showErrors && !touched[key]) return undefined;
    const code = fieldErrors[key] as OcrKtpFieldErrorKey | undefined;
    if (!code) return undefined;
    return t(code);
  };

  const inputCls = (key: keyof OcrKtpSnapshot) =>
    errorText(key) ? inputErrorClass : inputClass;

  const patch = (key: keyof OcrKtpSnapshot, raw: string) => {
    onChange({ ...value, [key]: raw });
  };

  const markTouched = (key: keyof OcrKtpSnapshot) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{t('ocrReviewTitle')}</p>
        <p className="mt-1 text-xs text-gray-500">{t('ocrReviewHint')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Field id="ocr-nik" label={t('ocrNik')} required error={errorText('nik')}>
          <input
            id="ocr-nik"
            type="text"
            inputMode="numeric"
            value={value.nik}
            onChange={(e) => patch('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
            onBlur={() => markTouched('nik')}
            disabled={disabled}
            className={inputCls('nik')}
            placeholder="3171234567890123"
            autoComplete="off"
          />
        </Field>

        <Field id="ocr-nama" label={t('ocrNama')} required error={errorText('nama')}>
          <input
            id="ocr-nama"
            type="text"
            value={value.nama}
            onChange={(e) => patch('nama', e.target.value)}
            onBlur={() => markTouched('nama')}
            disabled={disabled}
            className={inputCls('nama')}
          />
        </Field>

        <Field
          id="ocr-tempat-lahir"
          label={t('ocrTempatLahir')}
          required
          error={errorText('tempatLahir')}
        >
          <input
            id="ocr-tempat-lahir"
            type="text"
            value={value.tempatLahir}
            onChange={(e) => patch('tempatLahir', e.target.value)}
            onBlur={() => markTouched('tempatLahir')}
            disabled={disabled}
            className={inputCls('tempatLahir')}
          />
        </Field>

        <Field
          id="ocr-tanggal-lahir"
          label={t('ocrTanggalLahir')}
          required
          hint={t('ocrBirthDateHint')}
          error={errorText('tanggalLahir')}
        >
          <input
            id="ocr-tanggal-lahir"
            type="date"
            value={normalizeOcrBirthDate(value.tanggalLahir) ?? ''}
            onChange={(e) => patch('tanggalLahir', e.target.value)}
            onBlur={() => markTouched('tanggalLahir')}
            disabled={disabled}
            className={inputCls('tanggalLahir')}
            min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)}
            autoComplete="bday"
          />
        </Field>

        <Field
          id="ocr-jenis-kelamin"
          label={t('ocrJenisKelamin')}
          required
          error={errorText('jenisKelamin')}
        >
          <select
            id="ocr-jenis-kelamin"
            value={value.jenisKelamin}
            onChange={(e) => patch('jenisKelamin', e.target.value)}
            onBlur={() => markTouched('jenisKelamin')}
            disabled={disabled}
            className={inputCls('jenisKelamin')}
          >
            <option value="">—</option>
            <option value="MALE">{t('ocrGenderMale')}</option>
            <option value="FEMALE">{t('ocrGenderFemale')}</option>
          </select>
        </Field>

        <Field
          id="ocr-status-kawin"
          label={t('ocrStatusKawin')}
          required
          error={errorText('statusPerkawinan')}
        >
          <select
            id="ocr-status-kawin"
            value={value.statusPerkawinan}
            onChange={(e) => patch('statusPerkawinan', e.target.value)}
            onBlur={() => markTouched('statusPerkawinan')}
            disabled={disabled}
            className={inputCls('statusPerkawinan')}
          >
            <option value="">—</option>
            <option value="SINGLE">{t('ocrMaritalSingle')}</option>
            <option value="MARRIED">{t('ocrMaritalMarried')}</option>
          </select>
        </Field>

        <Field id="ocr-agama" label={t('ocrAgama')} required error={errorText('agama')}>
          <input
            id="ocr-agama"
            type="text"
            value={value.agama}
            onChange={(e) => patch('agama', e.target.value)}
            onBlur={() => markTouched('agama')}
            disabled={disabled}
            className={inputCls('agama')}
          />
        </Field>

        <Field
          id="ocr-kewarganegaraan"
          label={t('ocrKewarganegaraan')}
          required
          error={errorText('mrNationalityCode')}
        >
          <select
            id="ocr-kewarganegaraan"
            value={value.mrNationalityCode}
            onChange={(e) => patch('mrNationalityCode', e.target.value)}
            onBlur={() => markTouched('mrNationalityCode')}
            disabled={disabled}
            className={inputCls('mrNationalityCode')}
          >
            <option value="">—</option>
            <option value="LOCAL">{t('citizenTypeLocal')}</option>
            <option value="FOREIGNER">{t('citizenTypeForeigner')}</option>
          </select>
        </Field>
      </div>

      <Field id="ocr-alamat" label={t('ocrAlamat')} required error={errorText('alamat')}>
        <textarea
          id="ocr-alamat"
          value={value.alamat}
          onChange={(e) => patch('alamat', e.target.value)}
          onBlur={() => markTouched('alamat')}
          disabled={disabled}
          rows={2}
          className={`${inputCls('alamat')} h-auto py-2 resize-y`}
        />
      </Field>

      <div className="grid md:grid-cols-2 gap-3">
        <Field
          id="ocr-rt"
          label={t('ocrRt')}
          required
          hint={t('ocrRtRwHint')}
          error={errorText('Rt')}
        >
          <input
            id="ocr-rt"
            type="text"
            inputMode="numeric"
            value={value.Rt}
            onChange={(e) => patch('Rt', e.target.value.replace(/\D/g, '').slice(0, 3))}
            onBlur={() => markTouched('Rt')}
            disabled={disabled}
            className={inputCls('Rt')}
            placeholder="001"
            autoComplete="off"
          />
        </Field>

        <Field
          id="ocr-rw"
          label={t('ocrRw')}
          required
          hint={t('ocrRtRwHint')}
          error={errorText('Rw')}
        >
          <input
            id="ocr-rw"
            type="text"
            inputMode="numeric"
            value={value.Rw}
            onChange={(e) => patch('Rw', e.target.value.replace(/\D/g, '').slice(0, 3))}
            onBlur={() => markTouched('Rw')}
            disabled={disabled}
            className={inputCls('Rw')}
            placeholder="002"
            autoComplete="off"
          />
        </Field>

        <Field
          id="ocr-kelurahan"
          label={t('ocrKelurahan')}
          required
          error={errorText('kelurahanDesa')}
        >
          <input
            id="ocr-kelurahan"
            type="text"
            value={value.kelurahanDesa}
            onChange={(e) => patch('kelurahanDesa', e.target.value)}
            onBlur={() => markTouched('kelurahanDesa')}
            disabled={disabled}
            className={inputCls('kelurahanDesa')}
          />
        </Field>

        <Field
          id="ocr-kecamatan"
          label={t('ocrKecamatan')}
          required
          error={errorText('kecamatan')}
        >
          <input
            id="ocr-kecamatan"
            type="text"
            value={value.kecamatan}
            onChange={(e) => patch('kecamatan', e.target.value)}
            onBlur={() => markTouched('kecamatan')}
            disabled={disabled}
            className={inputCls('kecamatan')}
          />
        </Field>

        <Field id="ocr-kota" label={t('ocrKota')} required error={errorText('kotaKabupaten')}>
          <input
            id="ocr-kota"
            type="text"
            value={value.kotaKabupaten}
            onChange={(e) => patch('kotaKabupaten', e.target.value)}
            onBlur={() => markTouched('kotaKabupaten')}
            disabled={disabled}
            className={inputCls('kotaKabupaten')}
          />
        </Field>

        <Field id="ocr-provinsi" label={t('ocrProvinsi')} required error={errorText('provinsi')}>
          <input
            id="ocr-provinsi"
            type="text"
            value={value.provinsi}
            onChange={(e) => patch('provinsi', e.target.value)}
            onBlur={() => markTouched('provinsi')}
            disabled={disabled}
            className={inputCls('provinsi')}
          />
        </Field>

        <Field
          id="ocr-zipcode"
          label={t('ocrZipcode')}
          required
          hint={t('ocrZipcodeHint')}
          error={errorText('Zipcode')}
        >
          <input
            id="ocr-zipcode"
            type="text"
            inputMode="numeric"
            value={value.Zipcode}
            onChange={(e) => patch('Zipcode', e.target.value.replace(/\D/g, '').slice(0, 5))}
            onBlur={() => markTouched('Zipcode')}
            disabled={disabled}
            className={inputCls('Zipcode')}
            placeholder="11830"
            autoComplete="postal-code"
          />
        </Field>
      </div>
    </div>
  );
}
