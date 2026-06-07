'use client';

import { useEffect, useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IconCheck, IconX, IconClock, IconUserCheck, IconDownload, IconId, IconMapPin } from '@tabler/icons-react';
import Link from 'next/link';
import type { Vendor } from '@/app/types/credit-simulation';
import { LeadAssignRow } from '@/app/components/admin/leads/LeadAssignRow';

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  ktpUrl?: string | null;
  productName: string | null;
  vehicleSummary?: string | null;
  otrPrice: number | null;
  dpPercent: number | null;
  tenor: number | null;
  ipAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  slikStatus?: string | null;
  slikResultCode?: string | null;
  status: string;
  vendorCode?: string | null;
  vendorName?: string | null;
  vendorCity?: string | null;
  cmoEmpNo?: string | null;
  cmoName?: string | null;
  simulationLeadNo?: string | null;
  hyundaiLeadNo?: string | null;
  hyundaiAssignStatus?: string | null;
  hyundaiAssignError?: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New', icon: IconClock, color: 'bg-blue-100 text-blue-800' },
  { value: 'CONTACTED', label: 'Contacted', icon: IconUserCheck, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'QUALIFIED', label: 'Qualified', icon: IconCheck, color: 'bg-green-100 text-green-800' },
  { value: 'CLOSED', label: 'Closed', icon: IconX, color: 'bg-gray-100 text-gray-800' },
];

const formatCurrency = (n: number | null) =>
  n != null
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
    : '-';

const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', { dateStyle: 'medium' });

export function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [runningSlikId, setRunningSlikId] = useState<string | null>(null);
  const [canChangeFollowUp, setCanChangeFollowUp] = useState<boolean>(false);
  const [canDownloadLeads, setCanDownloadLeads] = useState<boolean>(false);
  const [ktpPreviewLeadId, setKtpPreviewLeadId] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && setKtpPreviewLeadId(null);
    if (ktpPreviewLeadId) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [ktpPreviewLeadId]);

  useEffect(() => {
    fetch('/api/admin/me/activities')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const acts: string[] = data.activities || [];
        setCanChangeFollowUp(acts.includes('leads.changeFollowUpStatus'));
        setCanDownloadLeads(acts.includes('leads.downloadLeads'));
      })
      .catch(() => {
        setCanChangeFollowUp(false);
        setCanDownloadLeads(false);
      });
  }, []);

  useEffect(() => {
    setVendorsLoading(true);
    fetch('/api/admin/leads/vendors')
      .then((res) => res.json())
      .then((data) => setVendors(data.vendors ?? []))
      .catch((err) => console.error('Error loading vendors:', err))
      .finally(() => setVendorsLoading(false));
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/admin/leads?status=${statusFilter}` : '/api/admin/leads';
      const res = await fetch(url);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const runSlik = async (id: string) => {
    setRunningSlikId(id);
    try {
      const res = await fetch('/api/admin/leads/run-slik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        console.error('Failed to run SLIK', await res.json());
      }
      await fetchLeads();
    } catch (err) {
      console.error('Error running SLIK:', err);
    } finally {
      setRunningSlikId((current) => (current === id ? null : current));
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDownloadPdf = useCallback(() => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Daftar Leads', 14, 12);
    doc.setFontSize(9);
    doc.text(`Diunduh: ${new Date().toLocaleString('id-ID')}`, 14, 18);

    const headers = ['Tanggal', 'Nama', 'Telepon', 'Email', 'Produk', 'OTR', 'DP %', 'Tenor', 'Lokasi', 'SLIK', 'Status'];
    const rows = leads.map((lead) => {
      const statusOpt = STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];
      const location =
        lead.latitude != null && lead.longitude != null
          ? `${lead.latitude.toFixed(4)}, ${lead.longitude.toFixed(4)}`
          : '-';
      return [
        formatDate(lead.createdAt),
        lead.name,
        lead.phone,
        lead.email,
        (lead.productName || '-') + (lead.vehicleSummary ? ` (${lead.vehicleSummary})` : ''),
        lead.otrPrice != null ? formatCurrency(lead.otrPrice) : '-',
        lead.dpPercent != null ? String(lead.dpPercent) : '-',
        lead.tenor != null ? String(lead.tenor) : '-',
        location,
        lead.slikStatus ?? 'NOT_STARTED',
        statusOpt.label,
      ];
    });

    autoTable(doc, {
      startY: 22,
      head: [headers],
      body: rows.length ? rows : [['Tidak ada data leads']],
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 44, 95] },
      margin: { left: 14 },
    });

    doc.save(`leads-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [leads]);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
        <div className="flex items-center gap-3">
          {canDownloadLeads && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={leads.length === 0}
              className="inline-flex items-center gap-2 px-3 h-9 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <IconDownload size={18} />
              Download PDF
            </button>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 h-9 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                LeadNo
              </th>
              {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama
              </th> */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kontak
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produk
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Simulasi
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lokasi
              </th>
              {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SLIK
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Follow Up
              </th> */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dealer
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CMO
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-4 text-center text-gray-500">
                  Tidak ada data leads
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const statusOpt = STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];
                const StatusIcon = statusOpt.icon;
                return (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        {lead.simulationLeadNo && (
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="font-mono text-xs text-gray-900 select-all"
                              title="LeadNo dari simulasi (Step 4 PriceStep)"
                            >
                              {lead.simulationLeadNo}
                            </span>
                            <span className="inline-flex w-fit items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                              SIMULASI
                            </span>
                          </div>
                        )}
                        {lead.hyundaiLeadNo && (
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="font-mono text-xs text-gray-900 select-all"
                              title="LeadNo final (post admin submit ke Hyundai)"
                            >
                              {lead.hyundaiLeadNo}
                            </span>
                            <span
                              className={`inline-flex w-fit items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                lead.hyundaiAssignStatus === 'SUBMITTED'
                                  ? 'bg-green-100 text-green-700'
                                  : lead.hyundaiAssignStatus === 'FAILED'
                                  ? 'bg-red-100 text-red-700'
                                  : lead.hyundaiAssignStatus === 'SUBMITTING'
                                  ? 'bg-blue-100 text-blue-700 animate-pulse'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {lead.hyundaiAssignStatus ?? 'PENDING'}
                            </span>
                          </div>
                        )}
                        {!lead.simulationLeadNo && !lead.hyundaiLeadNo && (
                          <span className="text-xs text-gray-400 italic">belum ada</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex-col items-center gap-2">
                        <div className="flex items-center gap-1">
                          {lead.ktpUrl ? (
                            <button
                              type="button"
                              onClick={() => setKtpPreviewLeadId(lead.id)}
                              className="flex-shrink-0 rounded text-blue-500 hover:text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Lihat foto KTP"
                              aria-label="Lihat foto KTP"
                            >
                              <IconId size={18} stroke={2} />
                            </button>
                          ) : null}
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        </div>
                        <div className="text-sm text-gray-900">{lead.phone}</div>
                        <div className="text-xs text-gray-500">{lead.email}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm text-gray-900">{lead.productName || '-'}</div>
                      {lead.vehicleSummary && (
                        <div className="mt-0.5 text-xs text-gray-500">
                          {lead.vehicleSummary}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {lead.otrPrice || lead.dpPercent || lead.tenor ? (
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {lead.otrPrice && <div>OTR: {formatCurrency(lead.otrPrice)}</div>}
                          {lead.dpPercent && <div>DP: {lead.dpPercent}%</div>}
                          {lead.tenor && <div>Tenor: {lead.tenor} bln</div>}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 min-w-20">
                      {lead.latitude != null && lead.longitude != null && (
                        <Link
                          href={`https://www.google.com/maps?q=${lead.latitude},${lead.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-xs text-blue-500 hover:underline"
                        >
                          <IconMapPin size={12} stroke={2} className="text-blue-500" />
                          <span className="text-xs text-gray-500 block">
                            {lead.latitude.toFixed(4)}, {lead.longitude.toFixed(4)}
                          </span>
                        </Link>
                      )}
                      {lead.ipAddress && (
                        <span className="text-xs text-gray-600 block" title="IP tercatat">
                          IP: {lead.ipAddress}
                        </span>
                      )}
                      {lead.latitude == null && lead.longitude == null && lead.ipAddress == null && (
                        <span className="text-xs text-gray-500 italic">Tidak ada data</span>
                      )}
                    </td>
                    {/* <td className="px-3 py-2 whitespace-nowrap text-xs flex flex-col">
                      <span
                        className={`inline-flex items-center rounded-full ${
                          lead.slikStatus === 'QUALIFIED'
                            ? 'text-green-800'
                            : lead.slikStatus === 'NOT_QUALIFIED'
                            ? 'text-red-800'
                            : lead.slikStatus === 'ERROR'
                            ? 'text-red-700'
                            : lead.slikStatus === 'IN_PROGRESS'
                            ? 'text-yellow-700'
                            : 'text-gray-500'
                        }`}
                      >
                        {lead.slikStatus ?? 'NOT_STARTED'}
                      </span>
                      {lead.slikResultCode && (
                        <div className="mt-0.5 text-[10px] text-gray-500">
                          Code: {lead.slikResultCode}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => runSlik(lead.id)}
                        disabled={runningSlikId === lead.id}
                        className="inline-flex items-center px-1.5 py-0.5 border border-blue-500 text-blue-600 rounded text-xs hover:bg-blue-50 disabled:opacity-50 w-fit"
                      >
                        {runningSlikId === lead.id ? 'Running…' : 'Run SLIK'}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusOpt.color}`}
                      >
                        <StatusIcon size={14} />
                        {statusOpt.label}
                      </span>
                      <span className="text-xs text-gray-500 block">
                        Last updated at
                      </span>
                      <span className="text-xs text-gray-800 block">
                        {formatDate(lead.updatedAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm space-x-2">
                      {canChangeFollowUp ? (
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="text-gray-700">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-400">No follow up access</span>
                      )}
                    </td> */}
                    <LeadAssignRow
                      lead={lead}
                      vendors={vendors}
                      vendorsLoading={vendorsLoading}
                      canSubmit
                      onSubmitted={fetchLeads}
                    />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* KTP Preview Modal */}
      {ktpPreviewLeadId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setKtpPreviewLeadId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Preview foto KTP"
        >
          <div
            className="relative max-w-2xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setKtpPreviewLeadId(null)}
              className="absolute -top-10 right-0 p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
              aria-label="Tutup"
            >
              <IconX size={24} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- same-origin API proxy; avoids /_next/image + private S3 */}
            <img
              src={`/api/admin/lead-ktp?id=${encodeURIComponent(ktpPreviewLeadId)}`}
              alt="Foto KTP"
              width={800}
              height={600}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-xl bg-white"
            />
            <p className="mt-2 text-center text-sm text-white/90">Foto KTP - Klik di luar untuk menutup</p>
          </div>
        </div>
      )}
    </div>
  );
}
