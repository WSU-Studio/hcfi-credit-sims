'use client';

import { IconCheck, IconLoader2, IconX } from '@tabler/icons-react';
import type { TrackingStageProgress } from '@/lib/lead-tracking-stages';

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export interface TrackingStageTimelineProps {
  stages: TrackingStageProgress[];
  getLabel: (stageId: string) => string;
  labels: {
    empty: string;
    started: string;
    ended: string;
    statusCompleted: string;
    statusCurrent: string;
    statusPending: string;
    statusRejected: string;
    rejectedBanner: string;
  };
}

export function TrackingStageTimeline({
  stages,
  getLabel,
  labels,
}: TrackingStageTimelineProps) {
  const hasAnyProgress = stages.some((s) => s.status !== 'pending');
  const isRejected = stages.some((s) => s.status === 'rejected');

  if (!hasAnyProgress) {
    return <p className="text-sm text-gray-500 px-5 py-4">{labels.empty}</p>;
  }

  return (
    <div>
      {isRejected && (
        <div className="mx-5 mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {labels.rejectedBanner}
        </div>
      )}
      <ol className="relative space-y-0 px-5 py-5">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1;
          const isCompleted = stage.status === 'completed';
          const isCurrent = stage.status === 'current';
          const isRejectedStage = stage.status === 'rejected';
          const isPending = stage.status === 'pending';
          const started = formatDateTime(stage.startedAt);
          const ended = formatDateTime(stage.endedAt);

          return (
            <li
              key={stage.id}
              className={`relative flex gap-4 pb-6 last:pb-0 ${isPending ? 'opacity-50' : ''}`}
            >
              {!isLast && (
                <span
                  className={`absolute left-[11px] top-6 bottom-0 w-px ${
                    isCompleted
                      ? 'bg-[#002c5f]'
                      : isRejectedStage
                        ? 'bg-red-300'
                        : 'bg-gray-300'
                  }`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  isCompleted
                    ? 'border-[#002c5f] bg-[#002c5f] text-white'
                    : isRejectedStage
                      ? 'border-red-600 bg-red-600 text-white'
                      : isCurrent
                        ? 'border-[#002c5f] bg-white text-[#002c5f]'
                        : 'border-gray-300 bg-white text-gray-400'
                }`}
                aria-hidden
              >
                {isCompleted ? (
                  <IconCheck size={14} stroke={2.5} />
                ) : isRejectedStage ? (
                  <IconX size={14} stroke={2.5} />
                ) : isCurrent ? (
                  <IconLoader2 size={14} className="animate-spin" />
                ) : (
                  <span className="text-[10px] font-semibold">{index + 1}</span>
                )}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`text-sm font-semibold ${
                      isPending
                        ? 'text-gray-500'
                        : isRejectedStage
                          ? 'text-red-800'
                          : 'text-gray-900'
                    }`}
                  >
                    {getLabel(stage.id)}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-800'
                        : isRejectedStage
                          ? 'bg-red-50 text-red-800'
                          : isCurrent
                            ? 'bg-amber-50 text-amber-900'
                            : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isCompleted
                      ? labels.statusCompleted
                      : isRejectedStage
                        ? labels.statusRejected
                        : isCurrent
                          ? labels.statusCurrent
                          : labels.statusPending}
                  </span>
                </div>
                {(started || ended) && (
                  <dl className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                    {started && (
                      <div>
                        <dt className="inline text-gray-500">{labels.started}: </dt>
                        <dd className="inline">{started}</dd>
                      </div>
                    )}
                    {ended && (
                      <div>
                        <dt className="inline text-gray-500">{labels.ended}: </dt>
                        <dd className="inline">{ended}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
