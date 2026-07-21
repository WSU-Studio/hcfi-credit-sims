'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { IconSearch, IconLoader2 } from '@tabler/icons-react';
import {
  consentStatusTone,
  type LeadMonitoringResult,
  type LeadTaskHistoryItem,
} from '@/lib/lead-tracking';
import { HONEYPOT_FIELD } from '@/lib/security/honeypot';
import { HoneypotField } from '@/app/components/security/HoneypotField';

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function TaskHistoryTimeline({
  items,
  labels,
}: {
  items: LeadTaskHistoryItem[];
  labels: {
    empty: string;
    started: string;
    ended: string;
    assignee: string;
    trxNo: string;
  };
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 px-5 py-4">{labels.empty}</p>
    );
  }

  return (
    <ol className="relative space-y-0 px-5 py-5">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={`${item.Name}-${item.StartTime ?? index}`} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                className="absolute left-[9px] top-5 bottom-0 w-px bg-gray-500"
                aria-hidden
              />
            )}
            <span
              className={`relative z-[1] mt-1.5 h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                isLast
                  ? 'border-[#002c5f] bg-[#002c5f]'
                  : 'border-[#002c5f] bg-[#002c5f]/40'
              }`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{item.Name}</p>
              <dl className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                <div>
                  <dt className="inline text-gray-500">{labels.started}: </dt>
                  <dd className="inline">{formatDateTime(item.StartTime)}</dd>
                </div>
                <div>
                  <dt className="inline text-gray-500">{labels.ended}: </dt>
                  <dd className="inline">{formatDateTime(item.EndTime)}</dd>
                </div>
                {item.Assignee && (
                  <div>
                    <dt className="inline text-gray-500">{labels.assignee}: </dt>
                    <dd className="inline">{item.Assignee}</dd>
                  </div>
                )}
                {item.TrxNo && (
                  <div>
                    <dt className="inline text-gray-500">{labels.trxNo}: </dt>
                    <dd className="inline font-mono">{item.TrxNo}</dd>
                  </div>
                )}
              </dl>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function LeadTrackingForm() {
  const t = useTranslations('tracking');
  const [leadNo, setLeadNo] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [result, setResult] = useState<LeadMonitoringResult | null>(null);
  const [pendingSubmit, setPendingSubmit] = useState(false);

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
    setPendingSubmit(false);
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
      if (!data.found || !data.data) {
        if (data.reason === 'pending_submit') {
          setPendingSubmit(true);
        } else {
          setNotFound(true);
        }
        return;
      }
      setResult(data.data as LeadMonitoringResult);
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

      {pendingSubmit && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {t('pendingSubmit')}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{t('resultLeadNo')}</p>
                <p className="font-mono text-base font-semibold text-gray-900">{result.LeadNo}</p>
              </div>
              {result.SimulationLeadNo &&
                result.SimulationLeadNo !== result.LeadNo && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {t('resultSimulationLeadNo')}
                    </p>
                    <p className="font-mono text-sm text-gray-700">{result.SimulationLeadNo}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('resolvedFromSimulationHint')}</p>
                  </div>
                )}
            </div>
            {result.CustConsentStatus ? (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${consentStatusTone(
                  result.CustConsentStatus
                )}`}
              >
                {t('resultConsent')}: {result.CustConsentStatus}
              </span>
            ) : null}
          </div>

          {(result.CustName || result.VehicleSummary) && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 text-sm border-b border-gray-100">
              {result.CustName ? (
                <div>
                  <dt className="text-gray-500">{t('resultCustomer')}</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{result.CustName}</dd>
                </div>
              ) : null}
              {result.VehicleSummary ? (
                <div>
                  <dt className="text-gray-500">{t('resultAsset')}</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{result.VehicleSummary}</dd>
                </div>
              ) : null}
            </dl>
          )}

          <div className="px-5 pt-4">
            <h2 className="text-sm font-semibold text-gray-900">{t('historyTitle')}</h2>
            <p className="mt-0.5 text-xs text-gray-500">{t('historyHint')}</p>
          </div>

          <TaskHistoryTimeline
            items={result.ListTaskHistory}
            labels={{
              empty: t('historyEmpty'),
              started: t('historyStarted'),
              ended: t('historyEnded'),
              assignee: t('historyAssignee'),
              trxNo: t('historyTrxNo'),
            }}
          />
        </div>
      )}
    </div>
  );
}
