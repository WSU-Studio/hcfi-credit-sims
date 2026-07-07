'use client';

import { useTranslations } from 'next-intl';
import type { OcrKtpSnapshot } from '@/lib/ocr-ktp-snapshot';

type KtpOcrReviewFormProps = {
  value: OcrKtpSnapshot;
  onChange: (next: OcrKtpSnapshot) => void;
  disabled?: boolean;
};

const inputClass =
  'w-full px-3 h-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed';

const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

function Field({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-0.5 text-[10px] text-gray-400">{hint}</p>}
    </div>
  );
}

export function KtpOcrReviewForm({ value, onChange, disabled = false }: KtpOcrReviewFormProps) {
  const t = useTranslations('creditSimulation');

  const patch = (key: keyof OcrKtpSnapshot, raw: string) => {
    onChange({ ...value, [key]: raw });
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{t('ocrReviewTitle')}</p>
        <p className="mt-1 text-xs text-gray-500">{t('ocrReviewHint')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Field id="ocr-nik" label={t('ocrNik')} required>
          <input
            id="ocr-nik"
            type="text"
            inputMode="numeric"
            value={value.nik}
            onChange={(e) => patch('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
            disabled={disabled}
            className={inputClass}
            placeholder="3171234567890123"
          />
        </Field>

        <Field id="ocr-nama" label={t('ocrNama')} required>
          <input
            id="ocr-nama"
            type="text"
            value={value.nama}
            onChange={(e) => patch('nama', e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field id="ocr-tempat-lahir" label={t('ocrTempatLahir')} required>
          <input
            id="ocr-tempat-lahir"
            type="text"
            value={value.tempatLahir}
            onChange={(e) => patch('tempatLahir', e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field id="ocr-tanggal-lahir" label={t('ocrTanggalLahir')} required hint="YYYY-MM-DD atau DD-MM-YYYY">
          <input
            id="ocr-tanggal-lahir"
            type="text"
            value={value.tanggalLahir}
            onChange={(e) => patch('tanggalLahir', e.target.value)}
            disabled={disabled}
            className={inputClass}
            placeholder="1986-04-09"
          />
        </Field>

        <Field id="ocr-jenis-kelamin" label={t('ocrJenisKelamin')}>
          <select
            id="ocr-jenis-kelamin"
            value={value.jenisKelamin}
            onChange={(e) => patch('jenisKelamin', e.target.value)}
            disabled={disabled}
            className={inputClass}
          >
            <option value="">—</option>
            <option value="MALE">{t('ocrGenderMale')}</option>
            <option value="FEMALE">{t('ocrGenderFemale')}</option>
          </select>
        </Field>

        <Field id="ocr-status-kawin" label={t('ocrStatusKawin')}>
          <select
            id="ocr-status-kawin"
            value={value.statusPerkawinan}
            onChange={(e) => patch('statusPerkawinan', e.target.value)}
            disabled={disabled}
            className={inputClass}
          >
            <option value="">—</option>
            <option value="SINGLE">{t('ocrMaritalSingle')}</option>
            <option value="MARRIED">{t('ocrMaritalMarried')}</option>
          </select>
        </Field>

        <Field id="ocr-agama" label={t('ocrAgama')}>
          <input
            id="ocr-agama"
            type="text"
            value={value.agama}
            onChange={(e) => patch('agama', e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field id="ocr-kewarganegaraan" label={t('ocrKewarganegaraan')}>
          <select
            id="ocr-kewarganegaraan"
            value={value.mrNationalityCode}
            onChange={(e) => patch('mrNationalityCode', e.target.value)}
            disabled={disabled}
            className={inputClass}
          >
            <option value="">—</option>
            <option value="LOCAL">{t('citizenTypeLocal')}</option>
            <option value="FOREIGNER">{t('citizenTypeForeigner')}</option>
          </select>
        </Field>
      </div>

      <Field id="ocr-alamat" label={t('ocrAlamat')} required>
        <textarea
          id="ocr-alamat"
          value={value.alamat}
          onChange={(e) => patch('alamat', e.target.value)}
          disabled={disabled}
          rows={2}
          className={`${inputClass} h-auto py-2 resize-y`}
        />
      </Field>

      <div className="grid md:grid-cols-2 gap-3">
        <Field id="ocr-rt" label={t('ocrRt')} hint={t('ocrAreaCode4Hint')}>
          <input
            id="ocr-rt"
            type="text"
            value={value.Rt}
            onChange={(e) => patch('Rt', e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field id="ocr-rw" label={t('ocrRw')} hint={t('ocrAreaCode3Hint')}>
          <input
            id="ocr-rw"
            type="text"
            value={value.Rw}
            onChange={(e) => patch('Rw', e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field id="ocr-kelurahan" label={t('ocrKelurahan')} required hint={t('ocrAreaCode2Hint')}>
          <input
            id="ocr-kelurahan"
            type="text"
            value={value.kelurahanDesa}
            onChange={(e) => patch('kelurahanDesa', e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field id="ocr-kecamatan" label={t('ocrKecamatan')} required hint={t('ocrAreaCode1Hint')}>
          <input
            id="ocr-kecamatan"
            type="text"
            value={value.kecamatan}
            onChange={(e) => patch('kecamatan', e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field id="ocr-kota" label={t('ocrKota')} required>
          <input
            id="ocr-kota"
            type="text"
            value={value.kotaKabupaten}
            onChange={(e) => patch('kotaKabupaten', e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field id="ocr-provinsi" label={t('ocrProvinsi')}>
          <input
            id="ocr-provinsi"
            type="text"
            value={value.provinsi}
            onChange={(e) => patch('provinsi', e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
        </Field>

        <Field id="ocr-zipcode" label={t('ocrZipcode')}>
          <input
            id="ocr-zipcode"
            type="text"
            inputMode="numeric"
            value={value.Zipcode}
            onChange={(e) => patch('Zipcode', e.target.value.replace(/\D/g, '').slice(0, 5))}
            disabled={disabled}
            className={inputClass}
            placeholder="11830"
          />
        </Field>
      </div>
    </div>
  );
}
