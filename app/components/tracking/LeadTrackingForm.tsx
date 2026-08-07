'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { IconSearch, IconLoader2 } from '@tabler/icons-react';
import {
  consentStatusTone,
  type LeadMonitoringResult,
} from '@/lib/lead-tracking';
import { collapseTaskHistoryToStages, findRejectedTrackingTask } from '@/lib/lead-tracking-stages';
import { HONEYPOT_FIELD } from '@/lib/security/honeypot';
import { HoneypotField } from '@/app/components/security/HoneypotField';
import { TrackingStageTimeline } from '@/app/components/tracking/TrackingStageTimeline';

export function LeadTrackingForm() {
  const t = useTranslations('tracking');
  const [leadNo, setLeadNo] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [result, setResult] = useState<LeadMonitoringResult | null>(null);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [queriedLeadNo, setQueriedLeadNo] = useState<string | null>(null);
  const [resolvedFromSimulation, setResolvedFromSimulation] = useState(false);

  const stages = useMemo(() => {
    if (!result) return [];
    const collapsed = collapseTaskHistoryToStages(result.ListTaskHistory);
    const rejectTask = findRejectedTrackingTask(result.ListTaskHistory);
    const hasReject = Boolean(result.HasRejectedTask || rejectTask);
    if (!hasReject || collapsed.some((s) => s.status === 'rejected')) {
      return collapsed;
    }

    // Safety net jika flag reject ada tapi collapse terlewat (cache/bundle mismatch).
    let targetIndex = collapsed.findIndex((s) => s.id === 'Data Verification');
    const furthest = collapsed.reduce(
      (acc, s, i) => (s.status !== 'pending' ? i : acc),
      -1
    );
    if (furthest >= 0) targetIndex = furthest;
    if (targetIndex < 0) targetIndex = 1;

    return collapsed.map((s, i) => {
      if (i < targetIndex) return { ...s, status: 'completed' as const };
      if (i === targetIndex) {
        return {
          ...s,
          status: 'rejected' as const,
          startedAt: rejectTask?.StartTime ?? s.startedAt,
          endedAt: rejectTask?.EndTime ?? s.endedAt,
        };
      }
      return { ...s, status: 'pending' as const, startedAt: null, endedAt: null };
    });
  }, [result]);

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
    setQueriedLeadNo(null);
    setResolvedFromSimulation(false);

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
      const monitoring = data.data as LeadMonitoringResult;
      setResult(monitoring);
      setQueriedLeadNo(
        typeof data.queriedLeadNo === 'string' ? data.queriedLeadNo : trimmed.toUpperCase()
      );
      setResolvedFromSimulation(Boolean(data.resolvedFromSimulation));
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
              {((result.SimulationLeadNo && result.SimulationLeadNo !== result.LeadNo) ||
                (resolvedFromSimulation &&
                  queriedLeadNo &&
                  queriedLeadNo !== result.LeadNo)) && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {t('resultSimulationLeadNo')}
                    </p>
                    <p className="font-mono text-sm text-gray-700">
                      {result.SimulationLeadNo || queriedLeadNo}
                    </p>
                    {/* <p className="mt-1 text-xs text-gray-500">{t('resolvedFromSimulationHint')}</p> */}
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

          <TrackingStageTimeline
            stages={stages}
            getLabel={(stageId) => t(`stages.${stageId}` as 'stages.Application Submitted')}
            labels={{
              empty: t('historyEmpty'),
              started: t('historyStarted'),
              ended: t('historyEnded'),
              statusCompleted: t('stageStatusCompleted'),
              statusCurrent: t('stageStatusCurrent'),
              statusPending: t('stageStatusPending'),
              statusRejected: t('stageStatusRejected'),
              rejectedBanner: t('rejectedBanner'),
            }}
          />
        </div>
      )}
    </div>
  );
}
