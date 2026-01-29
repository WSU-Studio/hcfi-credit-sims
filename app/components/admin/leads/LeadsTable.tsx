'use client';

import { useEffect, useState } from 'react';
import { IconCheck, IconX, IconClock, IconUserCheck } from '@tabler/icons-react';

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  productName: string | null;
  otrPrice: number | null;
  dpPercent: number | null;
  tenor: number | null;
  status: string;
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

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

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

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kontak
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Simulasi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada data leads
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const statusOpt = STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];
                const StatusIcon = statusOpt.icon;
                return (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.phone}</div>
                      <div className="text-xs text-gray-500">{lead.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{lead.productName || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusOpt.color}`}
                      >
                        <StatusIcon size={14} />
                        {statusOpt.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={lead.status}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
