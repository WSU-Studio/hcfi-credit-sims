import { z } from 'zod';
import type { OcrKtpRead } from '@/lib/hyundai-ocr';
import { cleanString } from '@/lib/security/sanitize';

const optionalOcrText = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
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
  return parsed.success ? parsed.data : emptyOcrKtpSnapshot();
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
  const parsed = ocrKtpSnapshotSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

const REQUIRED_SNAPSHOT_FIELDS: (keyof OcrKtpSnapshot)[] = [
  'nik',
  'nama',
  'tempatLahir',
  'tanggalLahir',
  'jenisKelamin',
  'statusPerkawinan',
  'agama',
  'mrNationalityCode',
  'alamat',
  'Rt',
  'Rw',
  'kecamatan',
  'kelurahanDesa',
  'kotaKabupaten',
  'provinsi',
  'Zipcode',
];

export function isOcrKtpSnapshotComplete(snapshot: OcrKtpSnapshot): boolean {
  const nikDigits = snapshot.nik.replace(/\D/g, '');
  if (nikDigits.length !== 16) return false;
  const zipDigits = snapshot.Zipcode.replace(/\D/g, '');
  if (zipDigits.length !== 5) return false;
  return REQUIRED_SNAPSHOT_FIELDS.every((key) => snapshot[key].trim().length > 0);
}
