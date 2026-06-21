'use client';

import { useEffect, useState } from 'react';
import {
  IconCheck,
  IconX,
  IconClock,
  IconUserCheck,
} from '@tabler/icons-react';

type SalesUser = {
  id: string;
  name: string;
  email: string;
};

type DealerLead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  productName: string | null;
  vehicleSummary?: string | null;
  otrPrice: number | null;
  dpPercent: number | null;
  tenor: number | null;
  status: string;
  simulationLeadNo?: string | null;
  createdAt: string;
  salesUser?: SalesUser | null;
};

type DealerLeadsScope = {
  isSalesman: boolean;
  isDealerAdmin: boolean;
  vendorName: string | null;
};

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'Baru', icon: IconClock, color: 'bg-blue-100 text-blue-800' },
  { value: 'CONTACTED', label: 'Dihubungi', icon: IconUserCheck, color: 'bg-amber-100 text-amber-800' },
  { value: 'QUALIFIED', label: 'Qualified', icon: IconCheck, color: 'bg-emerald-100 text-emerald-800' },
  { value: 'CLOSED', label: 'Closed', icon: IconX, color: 'bg-gray-100 text-gray-800' },
];

const formatCurrency = (n: number | null) =>
  n != null
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(n)
    : '-';

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('id-ID', { dateStyle: 'medium' });

export function DealerLeadsTable() {
  const [leads, setLeads] = useState<DealerLead[]>([]);
  const [scope, setScope] = useState<DealerLeadsScope | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchLeads = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);

    fetch(`/api/dealer/leads?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setLeads(data.leads || []);
        setScope(data.scope || null);
      })
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">Memuat leads...</div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {scope?.isSalesman ? 'Leads Saya' : 'Leads Dealer'}
          </h2>
          {scope?.vendorName && (
            <p className="text-xs text-gray-500 mt-0.5">{scope.vendorName}</p>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 h-9 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-[#002c5f]"
        >
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {leads.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500 text-sm">
          {scope?.isSalesman
            ? 'Belum ada leads dari quotation Anda.'
            : 'Belum ada leads dari tim sales dealer ini.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kontak
                </th>
                {scope?.isDealerAdmin && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sales
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Produk
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Simulasi
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leads.map((lead) => {
                const statusOpt =
                  STATUS_OPTIONS.find((s) => s.value === lead.status) ??
                  STATUS_OPTIONS[0];
                const StatusIcon = statusOpt.icon;

                return (
                  <tr key={lead.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(lead.createdAt)}
                      {lead.simulationLeadNo && (
                        <div className="mt-1 font-mono text-[10px] text-gray-400">
                          {lead.simulationLeadNo}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                      <div className="text-sm text-gray-600">{lead.phone}</div>
                      <div className="text-xs text-gray-500">{lead.email}</div>
                    </td>
                    {scope?.isDealerAdmin && (
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {lead.salesUser?.name ?? '-'}
                        {lead.salesUser?.email && (
                          <div className="text-xs text-gray-400">{lead.salesUser.email}</div>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{lead.productName || '-'}</div>
                      {lead.vehicleSummary && (
                        <div className="text-xs text-gray-500 mt-0.5">{lead.vehicleSummary}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {lead.otrPrice && <div>OTR: {formatCurrency(lead.otrPrice)}</div>}
                      {lead.dpPercent != null && <div>DP: {lead.dpPercent}%</div>}
                      {lead.tenor != null && <div>Tenor: {lead.tenor} bln</div>}
                      {!lead.otrPrice && lead.dpPercent == null && lead.tenor == null && (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusOpt.color}`}
                      >
                        <StatusIcon size={12} />
                        {statusOpt.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
