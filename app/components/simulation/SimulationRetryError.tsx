'use client';

interface SimulationRetryErrorProps {
  title: string;
  message: string;
  hint: string;
  secondaryHint?: string;
  retryLabel: string;
  onRetry: () => void;
  retrying?: boolean;
  compact?: boolean;
}

export function SimulationRetryError({
  title,
  message,
  hint,
  secondaryHint,
  retryLabel,
  onRetry,
  retrying = false,
  compact = false,
}: SimulationRetryErrorProps) {
  return (
    <div
      className={
        compact
          ? 'p-4 rounded-lg bg-red-50 border border-red-200 text-gray-900 space-y-3'
          : 'p-6 rounded-xl bg-red-50 border border-red-200 text-gray-900 space-y-4'
      }
      role="alert"
    >
      <div>
        <p className="text-red-700 font-semibold mb-1">{title}</p>
        <p className="text-red-600 text-sm">{message}</p>
      </div>
      <p className="text-sm text-gray-700">{hint}</p>
      {secondaryHint && <p className="text-sm text-gray-500">{secondaryHint}</p>}
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="px-5 py-2.5 bg-[#002c5f] text-white rounded-lg font-medium hover:bg-[#002c5f]/90 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
      >
        {retryLabel}
      </button>
    </div>
  );
}
