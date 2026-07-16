'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { IconSearch, IconLoader2 } from '@tabler/icons-react';
import type { WebsiteLeadStage } from '@/lib/lead-tracking';
import { HONEYPOT_FIELD } from '@/lib/security/honeypot';
import { HoneypotField } from '@/app/components/security/HoneypotField';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || '-';
  return d.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusTone(statCode: string, statDescr: string) {
  const code = `${statCode} ${statDescr}`.toUpperCase();
  if (code.includes('APPROV') || code.includes('DONE') || code.includes('COMPLETE')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  if (code.includes('REJECT') || code.includes('CANCEL')) {
    return 'bg-red-50 text-red-800 border-red-200';
  }
  if (code.includes('PROGRESS') || code.includes('PRP') || code.includes('INPUT')) {
    return 'bg-amber-50 text-amber-900 border-amber-200';
  }
  return 'bg-slate-50 text-slate-800 border-slate-200';
}

export function LeadTrackingForm() {
  const t = useTranslations('tracking');
  const [leadNo, setLeadNo] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [result, setResult] = useState<WebsiteLeadStage | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = leadNo.trim();
    if (!trimmed) {
      setError(t('leadNoRequired'));
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);
    setResult(null);

    try {
      const res = await fetch('/api/public/lead-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadNo: trimmed,
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || t('errorGeneric'));
      }
      if (!data.found || !Array.isArray(data.data) || data.data.length === 0) {
        setNotFound(true);
        return;
      }
      setResult(data.data[0] as WebsiteLeadStage);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <label htmlFor="tracking-lead-no" className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('leadNoLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id="tracking-lead-no"
            type="text"
            value={leadNo}
            onChange={(e) => setLeadNo(e.target.value.toUpperCase())}
            placeholder={t('leadNoPlaceholder')}
            autoComplete="off"
            spellCheck={false}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-mono text-sm tracking-wide uppercase focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] text-black"
          />
          <p className="mt-1.5 text-xs text-gray-500">{t('leadNoHint')}</p>
        </div>

        <HoneypotField value={honeypot} onChange={setHoneypot} />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-2.5 bg-[#002c5f] text-white rounded-lg font-semibold hover:bg-[#002c5f]/90 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
        >
          {loading ? <IconLoader2 size={18} className="animate-spin" /> : <IconSearch size={18} />}
          {loading ? t('searching') : t('search')}
        </button>
      </form>

      {notFound && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {t('notFound')}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{t('resultLeadNo')}</p>
              <p className="font-mono text-base font-semibold text-gray-900">{result.LeadNo}</p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusTone(
                result.LeadStatCode,
                result.LeadStatDescr
              )}`}
            >
              {result.LeadStatDescr || result.LeadStatCode || '-'}
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-5 py-5 text-sm">
            <div>
              <dt className="text-gray-500">{t('resultStep')}</dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {result.LeadStepDescr || result.LeadStepCode || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('resultAsset')}</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{result.AssetName || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('resultCustomer')}</dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {result.CustName?.trim() || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('resultChannel')}</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{result.ChannelCode || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('resultCreated')}</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{formatDateTime(result.CreatedDt)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('resultUpdated')}</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{formatDateTime(result.LastUpdDt)}</dd>
            </div>
            {result.ApprovalCode && (
              <div>
                <dt className="text-gray-500">{t('resultApproval')}</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{result.ApprovalCode}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
