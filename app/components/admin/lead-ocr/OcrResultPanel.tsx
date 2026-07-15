'use client';

import {
  IconCheck,
  IconAlertTriangle,
  IconScanEye,
} from '@tabler/icons-react';
import { JsonBlock } from '@/app/components/admin/lead-ocr/JsonBlock';
import {
  PostmanExportPanel,
  type OcrRequestExport,
} from '@/app/components/admin/lead-ocr/PostmanExportPanel';
import type { OcrKtpRead } from '@/lib/hyundai-ocr';

export type OcrTestResultMeta = {
  trxNo: string;
  sourceFileName: string;
  sourceContentType: string;
  sentFileName: string;
  sentContentType: string;
  sentByteSize: number;
  reEncoded: boolean;
};

export type OcrTestResultCategory =
  | 'SUCCESS'
  | 'EMPTY_READ'
  | 'HTTP_ERROR'
  | 'API_ERROR'
  | 'INVALID_JSON'
  | 'NETWORK_ERROR';

export type OcrTestResult = {
  category: OcrTestResultCategory;
  diagnosis: string;
  errorMessage: string | null;
  durationMs: number;
  meta: OcrTestResultMeta;
  read: OcrKtpRead | null;
  rawResponse: unknown;
  httpStatus?: number | null;
  request?: OcrRequestExport;
};

type Tone = 'success' | 'warning' | 'error';

const TONE_BY_CATEGORY: Record<OcrTestResultCategory, Tone> = {
  SUCCESS: 'success',
  EMPTY_READ: 'warning',
  HTTP_ERROR: 'error',
  API_ERROR: 'error',
  INVALID_JSON: 'error',
  NETWORK_ERROR: 'error',
};

const TITLE_BY_CATEGORY: Record<OcrTestResultCategory, string> = {
  SUCCESS: 'OCR berhasil — data KTP terbaca',
  EMPTY_READ: 'Request sukses, tapi data KTP kosong (foto mungkin kurang jelas)',
  HTTP_ERROR: 'Upstream OCR mengembalikan HTTP error',
  API_ERROR: 'Upstream OCR menolak request (StatusCode internal != 200)',
  INVALID_JSON: 'Response OCR tidak bisa di-parse',
  NETWORK_ERROR: 'Gagal mencapai server OCR',
};

const TONE_STYLES: Record<
  Tone,
  { header: string; iconWrap: string; httpBadgeOk: string; httpBadgeBad: string }
> = {
  success: {
    header: 'bg-green-50 border-green-200 text-green-800',
    iconWrap: 'bg-green-100 text-green-700',
    httpBadgeOk: 'bg-green-100 text-green-700',
    httpBadgeBad: 'bg-red-100 text-red-700',
  },
  warning: {
    header: 'bg-amber-50 border-amber-200 text-amber-900',
    iconWrap: 'bg-amber-100 text-amber-700',
    httpBadgeOk: 'bg-amber-100 text-amber-800',
    httpBadgeBad: 'bg-red-100 text-red-700',
  },
  error: {
    header: 'bg-red-50 border-red-200 text-red-800',
    iconWrap: 'bg-red-100 text-red-700',
    httpBadgeOk: 'bg-green-100 text-green-700',
    httpBadgeBad: 'bg-red-100 text-red-700',
  },
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-xs">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 text-right break-all">{value}</span>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <>
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 break-words">{value || '—'}</dd>
    </>
  );
}

function getToneIcon(tone: Tone, size = 16) {
  if (tone === 'success') return <IconCheck size={size} />;
  if (tone === 'warning') return <IconScanEye size={size} />;
  return <IconAlertTriangle size={size} />;
}

function EmptyReadHint() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-2">
      <p className="text-xs font-semibold text-amber-900">
        Kemungkinan penyebab gambar tidak terbaca:
      </p>
      <ul className="text-xs text-amber-900 list-disc pl-5 space-y-1">
        <li>Resolusi terlalu rendah / blur / noise tinggi</li>
        <li>Pencahayaan kurang, ada bayangan atau pantulan flash</li>
        <li>KTP tidak masuk frame penuh (sebagian terpotong)</li>
        <li>Gambar bukan KTP standar Indonesia (mis. SIM, Paspor, foto avatar)</li>
        <li>KTP lama dengan layout yang berbeda</li>
      </ul>
      <p className="text-xs text-amber-900">
        Verifikasi terlebih dahulu ini case dari sisi aplikasi atau dari endpoint yang disediakan
      </p>
    </div>
  );
}

/**
 * Render hasil tes OCR dengan 3 tone (sukses / warning / error) sesuai
 * kategori dari analyzer. Single-responsibility: hanya tampilkan, tidak fetch.
 */
export function OcrResultPanel({ result }: { result: OcrTestResult }) {
  const tone = TONE_BY_CATEGORY[result.category];
  const styles = TONE_STYLES[tone];
  const title = TITLE_BY_CATEGORY[result.category];
  const isSuccess = result.category === 'SUCCESS';
  const read = result.read;

  const httpBadgeClass =
    typeof result.httpStatus === 'number' &&
    result.httpStatus >= 200 &&
    result.httpStatus < 300
      ? styles.httpBadgeOk
      : styles.httpBadgeBad;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className={`px-4 py-3 flex items-center gap-3 border-b ${styles.header}`}>
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${styles.iconWrap}`}
          >
            {getToneIcon(tone)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs mt-0.5 break-words opacity-90">{result.diagnosis}</p>
            {result.errorMessage && (
              <p className="text-xs mt-1 font-mono break-words">
                {result.errorMessage}
              </p>
            )}
          </div>
          {typeof result.httpStatus === 'number' && (
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded shrink-0 ${httpBadgeClass}`}
            >
              HTTP {result.httpStatus}
            </span>
          )}
          <span className="text-xs font-mono text-gray-600 shrink-0">
            {result.durationMs} ms
          </span>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        <div className="p-4 space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Metadata Request
          </h4>
          <div className="divide-y divide-gray-100">
            <MetaRow label="trxNo" value={<span className="font-mono">{result.meta.trxNo}</span>} />
            <MetaRow label="File asli" value={result.meta.sourceFileName} />
            <MetaRow label="MIME asli" value={result.meta.sourceContentType} />
            <MetaRow
              label="File terkirim"
              value={
                <>
                  {result.meta.sentFileName}
                  {result.meta.reEncoded && (
                    <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                      re-encoded JPEG
                    </span>
                  )}
                </>
              }
            />
            <MetaRow label="MIME terkirim" value={result.meta.sentContentType} />
            <MetaRow label="Ukuran terkirim" value={formatBytes(result.meta.sentByteSize)} />
          </div>

          {isSuccess && read && (
            <div className="pt-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Data terparse
              </h4>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
                <ReadField label="NIK" value={read.nik} />
                <ReadField label="Nama" value={read.nama} />
                <ReadField label="Tempat lahir" value={read.tempatLahir} />
                <ReadField label="Tanggal lahir" value={read.tanggalLahir} />
                <ReadField label="Jenis kelamin" value={read.jenisKelamin} />
                <ReadField label="Status kawin" value={read.statusPerkawinan} />
                <ReadField label="Agama" value={read.agama} />
                <ReadField label="Alamat" value={read.alamat} />
                <ReadField label="RT/RW" value={[read.Rt, read.Rw].filter(Boolean).join(' / ')} />
                <ReadField label="Kel/Desa" value={read.kelurahanDesa} />
                <ReadField label="Kecamatan" value={read.kecamatan} />
                <ReadField label="Kota/Kab" value={read.kotaKabupaten} />
                <ReadField label="Provinsi" value={read.provinsi} />
                <ReadField label="Kode pos" value={read.Zipcode} />
                <ReadField label="Kewarganegaraan" value={read.mrNationalityCode || read.kewarganegaraan} />
              </dl>
            </div>
          )}

          {result.category === 'EMPTY_READ' && (
            <div className="pt-3">
              <EmptyReadHint />
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Response Hyundai (raw)
          </h4>
          <JsonBlock value={result.rawResponse} maxHeightClass="max-h-[480px]" />
        </div>
      </div>
      </div>

      {result.request && <PostmanExportPanel request={result.request} />}
    </div>
  );
}
