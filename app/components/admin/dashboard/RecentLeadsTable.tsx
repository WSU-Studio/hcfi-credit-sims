import { AdminLink } from '@/app/components/admin/AdminLink';
import { IconCheck, IconX, IconClock, IconUserCheck } from '@tabler/icons-react';

export type RecentLead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  productName: string | null;
  otrPrice: number | null;
  dpPercent: number | null;
  tenor: number | null;
  status: string;
  createdAt: Date;
};

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New', icon: IconClock, color: 'bg-blue-100 text-blue-800' },
  { value: 'CONTACTED', label: 'Contacted', icon: IconUserCheck, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'QUALIFIED', label: 'Qualified', icon: IconCheck, color: 'bg-green-100 text-green-800' },
  { value: 'CLOSED', label: 'Closed', icon: IconX, color: 'bg-gray-100 text-gray-800' },
];

function formatCurrency(n: number | null) {
  if (n == null) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('id-ID', { dateStyle: 'medium' });
}

type RecentLeadsTableProps = {
  leads: RecentLead[];
};

export function RecentLeadsTable({ leads }: RecentLeadsTableProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Leads Terbaru</h2>
        <AdminLink
          href="/admin/leads"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Lihat semua →
        </AdminLink>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kontak
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produk / Simulasi
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">
                  Belum ada leads
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const statusOpt = STATUS_OPTIONS.find((s) => s.value === lead.status) ?? STATUS_OPTIONS[0];
                const StatusIcon = statusOpt.icon;
                return (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.phone}</div>
                      <div className="text-xs text-gray-500">{lead.email}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-sm text-gray-900">{lead.productName ?? '-'}</div>
                      {(lead.otrPrice ?? lead.dpPercent ?? lead.tenor) && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {lead.otrPrice != null && <span>OTR {formatCurrency(lead.otrPrice)}</span>}
                          {lead.dpPercent != null && <span> · DP {lead.dpPercent}%</span>}
                          {lead.tenor != null && <span> · {lead.tenor} bln</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusOpt.color}`}
                      >
                        <StatusIcon size={12} />
                        {statusOpt.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lead.createdAt)}
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
