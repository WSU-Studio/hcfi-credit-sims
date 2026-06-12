'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { JsonBlock } from '@/app/components/admin/lead-ocr/JsonBlock';

type LeadSummary = {
  id: string;
  name: string;
  phone: string;
  email: string;
  ktpUrl: string | null;
};

type OcrRow = {
  id: string;
  leadId: string;
  hyundaiLeadNo: string | null;
  ktpFileName: string | null;
  status: string;
  errorMessage: string | null;
  rawResponse: unknown;
  nik: string | null;
  nama: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  jenisKelamin: string | null;
  alamat: string | null;
  kotaKabupaten: string | null;
  kecamatan: string | null;
  kelurahanDesa: string | null;
  zipCode: string | null;
  agama: string | null;
  statusPerkawinan: string | null;
  mrNationalityCode: string | null;
  addLeadCustPayload: unknown;
  createdAt: string;
  lead: LeadSummary;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export function LeadOcrTable() {
  const [rows, setRows] = useState<OcrRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const res = await fetch(`/api/admin/lead-ocr${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat data');
      setRows(data.results || []);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
        >
          <option value="">Semua status</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
        </select>
        <button
          type="button"
          onClick={fetchRows}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Muat ulang
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">
          Belum ada hasil OCR. Data muncul setelah admin menekan SUBMIT pada lead yang memiliki KTP.
        </p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Waktu</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Lead</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Hyundai LeadNo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">NIK / Nama</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Alamat</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.map((row) => {
                const expanded = expandedId === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{row.lead.name}</div>
                        <div className="text-xs text-gray-500">{row.lead.phone}</div>
                        <Link
                          href="/admin/leads"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Lihat di Leads
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{row.hyundaiLeadNo || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            row.status === 'SUCCESS'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {row.status}
                        </span>
                        {row.errorMessage && (
                          <p className="text-xs text-red-600 mt-1 max-w-xs">{row.errorMessage}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>{row.nik || '—'}</div>
                        <div className="text-gray-600">{row.nama || '—'}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate" title={row.alamat || ''}>
                        {row.alamat || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : row.id)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                          Detail
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                Data terparse
                              </h4>
                              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <dt className="text-gray-500">Tempat / Tgl lahir</dt>
                                <dd>
                                  {[row.tempatLahir, row.tanggalLahir].filter(Boolean).join(', ') ||
                                    '—'}
                                </dd>
                                <dt className="text-gray-500">JK / Kawin</dt>
                                <dd>
                                  {[row.jenisKelamin, row.statusPerkawinan].filter(Boolean).join(' / ') ||
                                    '—'}
                                </dd>
                                <dt className="text-gray-500">Kota / Kec / Kel</dt>
                                <dd>
                                  {[row.kotaKabupaten, row.kecamatan, row.kelurahanDesa]
                                    .filter(Boolean)
                                    .join(' · ') || '—'}
                                </dd>
                                <dt className="text-gray-500">Kode pos / Agama</dt>
                                <dd>
                                  {[row.zipCode, row.agama].filter(Boolean).join(' · ') || '—'}
                                </dd>
                                <dt className="text-gray-500">Kewarganegaraan</dt>
                                <dd>{row.mrNationalityCode || '—'}</dd>
                                <dt className="text-gray-500">File KTP</dt>
                                <dd>{row.ktpFileName || '—'}</dd>
                              </dl>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                  Response OCR (raw)
                                </h4>
                                <JsonBlock value={row.rawResponse} />
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                  Payload AddLeadCust
                                </h4>
                                <JsonBlock value={row.addLeadCustPayload} />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
