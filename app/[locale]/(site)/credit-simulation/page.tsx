'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SimulationWizard } from '@/app/components/simulation/SimulationWizard';
import { LEAD_SOURCES } from '@/lib/lead-source';
import type { SimulationWizardLabels } from '@/lib/simulation-wizard-labels';

export default function SimulasiKreditPage() {
  const t = useTranslations('creditSimulation');

  const labels: SimulationWizardLabels = useMemo(
    () => ({
      title: t('title'),
      subtitle: t('subtitle'),
      stepDealer: t('stepDealer'),
      stepModel: t('stepModel'),
      stepSpec: t('stepSpec'),
      stepPrice: t('stepPrice'),
      stepResult: t('stepResult'),
      back: t('back'),
      stepOf: t('stepOf', { current: '{current}', total: '{total}' }),
      changeModel: t('changeModel'),
      leadAssetLoading: t('leadAssetLoading'),
      leadAssetError: t('leadAssetError'),
      leadAssetRetry: t('leadAssetRetry'),
      errorTitle: t('errorTitle'),
      errorRetryHint: t('errorRetryHint'),
      errorRetrySecondaryHint: t('errorRetrySecondaryHint'),
    }),
    [t]
  );

  return (
    <SimulationWizard
      mode="public"
      labels={labels}
      leadSource={LEAD_SOURCES.WEBSITE}
    />
  );
}
