'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type BlockingProcessOverlayProps = {
  open: boolean;
  title: string;
  message?: string;
  warning?: string;
};

export function BlockingProcessOverlay({
  open,
  title,
  message,
  warning = 'Please do not close this tab or browser until the process is complete.',
}: BlockingProcessOverlayProps) {
  useEffect(() => {
    if (!open || typeof window === 'undefined') return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#002c5f]/40 backdrop-blur-[2px] p-4"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="assertive"
      aria-labelledby="blocking-process-title"
      aria-describedby="blocking-process-desc"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 px-6 py-8 text-center">
        <div
          className="mx-auto mb-5 h-12 w-12 rounded-full border-[3px] border-[#002c5f]/20 border-t-[#002c5f] animate-spin"
          aria-hidden
        />
        <h2 id="blocking-process-title" className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        {message && (
          <p id="blocking-process-desc" className="mt-2 text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
        )}
        <p
          className={`${message ? 'mt-4' : 'mt-3'} text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed`}
        >
          {warning}
        </p>
      </div>
    </div>,
    document.body
  );
}
