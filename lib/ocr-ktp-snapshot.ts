import { z } from 'zod';
import type { OcrKtpRead } from '@/lib/hyundai-ocr';
import { cleanString } from '@/lib/security/sanitize';

const optionalOcrText = (max: number) =>
  z
    .union([z.string(), z.number(), z.boolean(), z.null(), z.undefined()])
    .transform((v) => {
      if (v == null) return '';
      return cleanString(String(v)).slice(0, max);
    });

/** Field OCR yang dipakai saat admin submit ke Hyundai AddLeadCust. */
export const ocrKtpSnapshotSchema = z.object({
  nik: optionalOcrText(16),
  nama: optionalOcrText(100),
  tempatLahir: optionalOcrText(100),
  tanggalLahir: optionalOcrText(20),
  jenisKelamin: optionalOcrText(20),
  statusPerkawinan: optionalOcrText(20),
  agama: optionalOcrText(30),
  mrNationalityCode: optionalOcrText(20),
  alamat: optionalOcrText(300),
  Rt: optionalOcrText(10),
  Rw: optionalOcrText(10),
  kecamatan: optionalOcrText(100),
  kelurahanDesa: optionalOcrText(100),
  kotaKabupaten: optionalOcrText(100),
  provinsi: optionalOcrText(100),
  Zipcode: optionalOcrText(10),
});

export type OcrKtpSnapshot = z.infer<typeof ocrKtpSnapshotSchema>;

export function emptyOcrKtpSnapshot(): OcrKtpSnapshot {
  return {
    nik: '',
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: '',
    statusPerkawinan: '',
    agama: '',
    mrNationalityCode: '',
    alamat: '',
    Rt: '',
    Rw: '',
    kecamatan: '',
    kelurahanDesa: '',
    kotaKabupaten: '',
    provinsi: '',
    Zipcode: '',
  };
}

export function ocrReadToSnapshot(read: OcrKtpRead | null | undefined): OcrKtpSnapshot {
  if (!read) return emptyOcrKtpSnapshot();
  const parsed = ocrKtpSnapshotSchema.safeParse({
    nik: read.nik,
    nama: read.nama,
    tempatLahir: read.tempatLahir,
    tanggalLahir: read.tanggalLahir,
    jenisKelamin: read.jenisKelamin,
    statusPerkawinan: read.statusPerkawinan,
    agama: read.agama,
    mrNationalityCode: read.mrNationalityCode || read.kewarganegaraan,
    alamat: read.alamat,
    Rt: read.Rt,
    Rw: read.Rw,
    kecamatan: read.kecamatan,
    kelurahanDesa: read.kelurahanDesa,
    kotaKabupaten: read.kotaKabupaten,
    provinsi: read.provinsi,
    Zipcode: read.Zipcode,
  });
  return sanitizeOcrKtpSnapshotDigits(
    parsed.success ? parsed.data : emptyOcrKtpSnapshot()
  );
}

export function snapshotToOcrRead(snapshot: OcrKtpSnapshot): OcrKtpRead {
  return {
    nik: snapshot.nik || undefined,
    nama: snapshot.nama || undefined,
    tempatLahir: snapshot.tempatLahir || undefined,
    tanggalLahir: snapshot.tanggalLahir || undefined,
    jenisKelamin: snapshot.jenisKelamin || undefined,
    statusPerkawinan: snapshot.statusPerkawinan || undefined,
    agama: snapshot.agama || undefined,
    mrNationalityCode: snapshot.mrNationalityCode || undefined,
    alamat: snapshot.alamat || undefined,
    Rt: snapshot.Rt || undefined,
    Rw: snapshot.Rw || undefined,
    kecamatan: snapshot.kecamatan || undefined,
    kelurahanDesa: snapshot.kelurahanDesa || undefined,
    kotaKabupaten: snapshot.kotaKabupaten || undefined,
    provinsi: snapshot.provinsi || undefined,
    Zipcode: snapshot.Zipcode || undefined,
  };
}

export function parseOcrKtpSnapshot(raw: unknown): OcrKtpSnapshot | null {
  const parsed = ocrKtpSnapshotSchema.safeParse(unwrapOcrSnapshotRaw(raw));
  return parsed.success ? parsed.data : null;
}

/**
 * Parse defensif untuk form admin/edit: jangan return kosong hanya karena
 * 1 field tipenya aneh (number) atau JSON tersimpan sebagai string.
 */
export function coerceOcrKtpSnapshot(raw: unknown): OcrKtpSnapshot {
  const unwrapped = unwrapOcrSnapshotRaw(raw);
  const parsed = ocrKtpSnapshotSchema.safeParse(unwrapped);
  if (parsed.success) {
    return sanitizeOcrKtpSnapshotDigits(parsed.data);
  }

  if (unwrapped && typeof unwrapped === 'object' && !Array.isArray(unwrapped)) {
    const r = unwrapped as Record<string, unknown>;
    const base = emptyOcrKtpSnapshot();
    (Object.keys(base) as (keyof OcrKtpSnapshot)[]).forEach((key) => {
      const v = r[key];
      if (v == null) return;
      base[key] = cleanString(String(v)).slice(0, 300);
    });
    return sanitizeOcrKtpSnapshotDigits(base);
  }

  return emptyOcrKtpSnapshot();
}

function unwrapOcrSnapshotRaw(raw: unknown): unknown {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    // Beberapa penyimpanan lama membungkus jadi { snapshot: {...} }
    if (
      r.snapshot &&
      typeof r.snapshot === 'object' &&
      !Array.isArray(r.snapshot) &&
      (r.nik == null && r.nama == null)
    ) {
      return r.snapshot;
    }
  }
  return raw;
}

/** Tanggal lahir: YYYY-MM-DD, DD-MM-YYYY, atau DD/MM/YYYY (tanggal kalender valid). */
export function parseOcrBirthDateParts(
  raw: string
): { year: number; month: number; day: number } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let year: number;
  let month: number;
  let day: number;

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const dmyDash = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  const dmySlash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (dmyDash) {
    day = Number(dmyDash[1]);
    month = Number(dmyDash[2]);
    year = Number(dmyDash[3]);
  } else if (dmySlash) {
    day = Number(dmySlash[1]);
    month = Number(dmySlash[2]);
    year = Number(dmySlash[3]);
  } else {
    return null;
  }

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  if (year < 1900 || year > currentYear) return null;
  if (dt.getTime() > Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) {
    return null;
  }

  return { year, month, day };
}

export function isValidOcrBirthDate(raw: string): boolean {
  return parseOcrBirthDateParts(raw) != null;
}

/** Normalisasi ke YYYY-MM-DD untuk payload downstream. */
export function normalizeOcrBirthDate(raw: string): string | null {
  const parts = parseOcrBirthDateParts(raw);
  if (!parts) return null;
  const mm = String(parts.month).padStart(2, '0');
  const dd = String(parts.day).padStart(2, '0');
  return `${parts.year}-${mm}-${dd}`;
}

/** RT/RW Confins: hanya digit, 1–3 karakter. */
export function isValidOcrRtRw(raw: string): boolean {
  return /^\d{1,3}$/.test(raw.trim());
}

export function isValidOcrZipcode(raw: string): boolean {
  return /^\d{5}$/.test(raw.trim());
}

export type OcrKtpFieldErrorKey =
  | 'ocrNikInvalid'
  | 'ocrBirthDateInvalid'
  | 'ocrRtRwInvalid'
  | 'ocrZipcodeInvalid'
  | 'ocrFieldRequired';

export type OcrKtpFieldErrors = Partial<
  Record<keyof OcrKtpSnapshot, OcrKtpFieldErrorKey>
>;

export function getOcrKtpFieldErrors(snapshot: OcrKtpSnapshot): OcrKtpFieldErrors {
  const errors: OcrKtpFieldErrors = {};
  const nikDigits = snapshot.nik.replace(/\D/g, '');
  if (!nikDigits) errors.nik = 'ocrFieldRequired';
  else if (nikDigits.length !== 16) errors.nik = 'ocrNikInvalid';

  if (!snapshot.nama.trim()) errors.nama = 'ocrFieldRequired';
  if (!snapshot.tempatLahir.trim()) errors.tempatLahir = 'ocrFieldRequired';

  if (!snapshot.tanggalLahir.trim()) errors.tanggalLahir = 'ocrFieldRequired';
  else if (!isValidOcrBirthDate(snapshot.tanggalLahir)) {
    errors.tanggalLahir = 'ocrBirthDateInvalid';
  }

  if (!snapshot.jenisKelamin.trim()) errors.jenisKelamin = 'ocrFieldRequired';
  if (!snapshot.statusPerkawinan.trim()) errors.statusPerkawinan = 'ocrFieldRequired';
  if (!snapshot.agama.trim()) errors.agama = 'ocrFieldRequired';
  if (!snapshot.mrNationalityCode.trim()) errors.mrNationalityCode = 'ocrFieldRequired';
  if (!snapshot.alamat.trim()) errors.alamat = 'ocrFieldRequired';

  if (!snapshot.Rt.trim()) errors.Rt = 'ocrFieldRequired';
  else if (!isValidOcrRtRw(snapshot.Rt)) errors.Rt = 'ocrRtRwInvalid';

  if (!snapshot.Rw.trim()) errors.Rw = 'ocrFieldRequired';
  else if (!isValidOcrRtRw(snapshot.Rw)) errors.Rw = 'ocrRtRwInvalid';

  if (!snapshot.kelurahanDesa.trim()) errors.kelurahanDesa = 'ocrFieldRequired';
  if (!snapshot.kecamatan.trim()) errors.kecamatan = 'ocrFieldRequired';
  if (!snapshot.kotaKabupaten.trim()) errors.kotaKabupaten = 'ocrFieldRequired';
  if (!snapshot.provinsi.trim()) errors.provinsi = 'ocrFieldRequired';

  if (!snapshot.Zipcode.trim()) errors.Zipcode = 'ocrFieldRequired';
  else if (!isValidOcrZipcode(snapshot.Zipcode)) errors.Zipcode = 'ocrZipcodeInvalid';

  return errors;
}

export function isOcrKtpSnapshotComplete(snapshot: OcrKtpSnapshot): boolean {
  return Object.keys(getOcrKtpFieldErrors(snapshot)).length === 0;
}

/** Bersihkan RT/RW/kode pos dari hasil OCR yang sering ikut karakter sampah. */
export function sanitizeOcrKtpSnapshotDigits(snapshot: OcrKtpSnapshot): OcrKtpSnapshot {
  const birth = normalizeOcrBirthDate(snapshot.tanggalLahir);
  return {
    ...snapshot,
    nik: snapshot.nik.replace(/\D/g, '').slice(0, 16),
    tanggalLahir: birth ?? snapshot.tanggalLahir.trim(),
    Rt: snapshot.Rt.replace(/\D/g, '').slice(0, 3),
    Rw: snapshot.Rw.replace(/\D/g, '').slice(0, 3),
    Zipcode: snapshot.Zipcode.replace(/\D/g, '').slice(0, 5),
  };
}
