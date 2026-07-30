'use client';

import { useCallback, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { IconFileDescription } from '@tabler/icons-react';
import {
  SimulationSummaryModal,
  type VehicleSummaryInfo,
} from '@/app/components/simulation/SimulationSummaryModal';
import type { FinalSummaryInfo } from '@/app/types/credit-simulation';
import { parseLeadAssetSnapshot } from '@/lib/lead-asset-snapshot';
import { parseVehicleSummaryParts } from '@/lib/hyundai-asset-resolve';
import idMessages from '@/messages/id.json';

export type LeadSimulationSummarySource = {
  simulationLeadNo?: string | null;
  hyundaiLeadNo?: string | null;
  productName: string | null;
  productCode?: string | null;
  firstInstallment?: string | null;
  isPromotion?: boolean | null;
  partnerCode?: string | null;
  otrPrice: number | null;
  discount?: number | null;
  dpPercent: number | null;
  tenor: number | null;
  vehicleSummary?: string | null;
  assetSnapshot?: unknown;
  createdAt?: string | null;
};

function resolveLeadNo(lead: LeadSimulationSummarySource): string | null {
  const sim = lead.simulationLeadNo?.trim();
  if (sim) return sim;
  const hyundai = lead.hyundaiLeadNo?.trim();
  return hyundai || null;
}

function resolveFirstInstallment(value?: string | null): 'ADDM' | 'ADDB' {
  return value === 'ADDB' ? 'ADDB' : 'ADDM';
}

function resolveVehicle(lead: LeadSimulationSummarySource): VehicleSummaryInfo {
  const snapshot = parseLeadAssetSnapshot(lead.assetSnapshot);
  if (snapshot) {
    return {
      modelName: snapshot.modelName || undefined,
      trimName: snapshot.trimName || undefined,
      exteriorColor: snapshot.exteriorColorName || undefined,
      interiorColor: snapshot.interiorColorName || undefined,
    };
  }
  const parts = parseVehicleSummaryParts(lead.vehicleSummary ?? null);
  return {
    modelName: parts.modelName || undefined,
    trimName: parts.trimName || undefined,
    exteriorColor: parts.exteriorName || undefined,
    interiorColor: parts.interiorName || undefined,
  };
}

function canOpenSummary(lead: LeadSimulationSummarySource): boolean {
  return Boolean(
    resolveLeadNo(lead) &&
      lead.otrPrice != null &&
      lead.otrPrice > 0 &&
      lead.dpPercent != null &&
      lead.tenor != null &&
      lead.tenor > 0 &&
      lead.productCode?.trim() &&
      lead.productName?.trim()
  );
}

interface LeadSimulationSummaryButtonProps {
  lead: LeadSimulationSummarySource;
}

export function LeadSimulationSummaryButton({ lead }: LeadSimulationSummaryButtonProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<FinalSummaryInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const enabled = canOpenSummary(lead);
  const leadNo = resolveLeadNo(lead);
  const firstInstallment = resolveFirstInstallment(lead.firstInstallment);
  const discount = Number(lead.discount) || 0;
  const vehicle = resolveVehicle(lead);

  const fetchSummary = useCallback(async () => {
    if (!enabled || !leadNo) return;

    setLoading(true);
    setError(null);
    setErrorId(null);
    try {
      const res = await fetch('/api/simulation/final-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadNo,
          LeadNo: leadNo,
          otrPrice: lead.otrPrice,
          dpPercent: lead.dpPercent,
          tenor: lead.tenor,
          productCode: lead.productCode,
          productName: lead.productName,
          firstInstallment,
          isPromotion: Boolean(lead.isPromotion),
          partnerCode: lead.partnerCode ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.errorId) setErrorId(String(data.errorId));
        throw new Error(data.error || data.message || 'Gagal memuat ringkasan kredit');
      }
      setSummary(data.summary as FinalSummaryInfo);
    } catch (e) {
      setSummary(null);
      setError(e instanceof Error ? e.message : 'Gagal memuat ringkasan kredit');
    } finally {
      setLoading(false);
    }
  }, [enabled, leadNo, lead, firstInstallment]);

  const handleOpen = () => {
    if (!enabled) return;
    setOpen(true);
    void fetchSummary();
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={!enabled}
        title={
          enabled
            ? 'Lihat ringkasan simulasi'
            : 'Data simulasi belum lengkap untuk menampilkan ringkasan'
        }
        className="mt-1.5 inline-flex items-center gap-1 px-1 py-1 border border-blue-500 text-blue-500 rounded text-[11px] font-medium hover:bg-blue-500/5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <IconFileDescription size={16} />
        Ringkasan
      </button>

      {open && (
        <NextIntlClientProvider locale="id" messages={idMessages}>
          <SimulationSummaryModal
            open={open}
            onClose={handleClose}
            leadNo={leadNo}
            createdAt={lead.createdAt}
            vehicle={vehicle}
            discount={discount}
            firstInstallment={firstInstallment}
            summary={summary}
            loading={loading}
            loadingMessage="Memuat data..."
            error={error}
            errorId={errorId}
            onRetry={fetchSummary}
          />
        </NextIntlClientProvider>
      )}
    </>
  );
}
