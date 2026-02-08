import { AdminLink } from '@/app/components/admin/AdminLink';

export type StatCardProps = {
  label: string;
  value: string | number;
  href?: string;
  sublabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: 'default' | 'primary' | 'success' | 'warning';
};

const accentStyles = {
  default: 'bg-gray-50 text-gray-700',
  primary: 'bg-blue-50 text-blue-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
};

export function StatCard({ label, value, href, sublabel, icon: Icon, accent = 'default' }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
          {sublabel != null && (
            <p className="mt-0.5 text-xs text-gray-500">{sublabel}</p>
          )}
        </div>
        {Icon != null && (
          <div className={`rounded-lg p-2 ${accentStyles[accent]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {href != null && (
        <p className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-800">Lihat detail →</p>
      )}
    </>
  );

  const className =
    'block w-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md text-left';

  if (href != null) {
    return (
      <AdminLink href={href} className={className}>
        {content}
      </AdminLink>
    );
  }

  return <div className={className}>{content}</div>;
}
