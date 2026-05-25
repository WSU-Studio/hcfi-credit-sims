'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { UserLocation } from '@/app/components/simulation/ContactModal';
import { Container } from '@/app/components/ui/Container';
import { DealerStep } from '@/app/components/simulation/DealerStep';
import { ModelStep } from '@/app/components/simulation/ModelStep';
import { SpecificationStep } from '@/app/components/simulation/SpecificationStep';
import { PriceStep } from '@/app/components/simulation/PriceStep';
import { ResultStep } from '@/app/components/simulation/ResultStep';
import { SimulationSidebar } from '@/app/components/simulation/SimulationSidebar';
import { SimulationRetryError } from '@/app/components/simulation/SimulationRetryError';
import type { Vendor, AssetMaster, ProductCalculation } from '@/app/types/credit-simulation';
import type { LeadAssetSnapshot } from '@/lib/lead-asset-snapshot';

type Step = 1 | 2 | 3 | 4 | 5;

export default function SimulasiKreditPage() {
  const t = useTranslations('creditSimulation');
  const [currentStep, setCurrentStep] = useState<Step>(1);
  
  // Form data
  const [selectedDealer, setSelectedDealer] = useState<Vendor | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetMaster | null>(null);
  const [specs, setSpecs] = useState<{
    manufacturingYear?: number;
    fscCode?: string;
    trimName?: string;
    exteriorColorCode?: string;
    exteriorColorName?: string;
    interiorColorCode?: string;
    interiorColorName?: string;
  }>({});
  const [otrPrice, setOtrPrice] = useState<number | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [leadNo, setLeadNo] = useState<string | null>(null);
  const [leadNoLoading, setLeadNoLoading] = useState(false);
  const [leadNoError, setLeadNoError] = useState<string | null>(null);
  const [leadNoErrorId, setLeadNoErrorId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductCalculation | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation>(null);

  // Request geolocation on page access (browser prompts for consent)
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {
        // User denied or error - we don't store location
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const handleDealerSelect = (dealer: Vendor) => {
    setSelectedDealer(dealer);
    setCurrentStep(2);
    // Reset step 2–5: user harus ulang pilih model, spesifikasi, harga, hasil
    setSelectedAsset(null);
    setSpecs({});
    setOtrPrice(null);
    setDiscount(0);
    setLeadNo(null);
    setLeadNoError(null);
    setLeadNoErrorId(null);
  };

  const handleAssetSelect = (asset: AssetMaster) => {
    setSelectedAsset(asset);
    setCurrentStep(3);
    // Reset step 3–5: user harus ulang spesifikasi, harga, hasil. Tidak bisa lompat ke step 4.
    setSpecs({});
    setOtrPrice(null);
    setDiscount(0);
    setLeadNo(null);
    setLeadNoError(null);
    setLeadNoErrorId(null);
  };

  const handleSpecsComplete = (completedSpecs: {
    manufacturingYear: number;
    fscCode: string;
    trimName: string;
    exteriorColorCode: string;
    exteriorColorName: string;
    interiorColorCode: string;
    interiorColorName: string;
  }) => {
    setSpecs(completedSpecs);
    setCurrentStep(4);
    // Reset step 4–5: user harus ulang input harga dan lihat hasil
    setOtrPrice(null);
    setLeadNo(null);
    setLeadNoError(null);
    setLeadNoErrorId(null);
  };

  const buildLeadAssetSnapshot = useCallback(
    (
      asset: AssetMaster,
      currentSpecs: typeof specs
    ): LeadAssetSnapshot | null => {
      if (
        !currentSpecs.manufacturingYear ||
        !currentSpecs.fscCode ||
        !currentSpecs.exteriorColorCode ||
        !currentSpecs.interiorColorCode
      ) {
        return null;
      }
      return {
        modelCode: asset.AssetCode,
        modelName: asset.AssetName,
        manufacturingYear: currentSpecs.manufacturingYear,
        fscCode: currentSpecs.fscCode,
        trimName: currentSpecs.trimName || '',
        exteriorColorCode: currentSpecs.exteriorColorCode,
        exteriorColorName: currentSpecs.exteriorColorName || '',
        interiorColorCode: currentSpecs.interiorColorCode,
        interiorColorName: currentSpecs.interiorColorName || '',
      };
    },
    []
  );

  const requestLeadAsset = useCallback(
    async (params: { netPrice: number; discountAmount: number }) => {
      if (!selectedDealer || !selectedAsset) return;
      const snapshot = buildLeadAssetSnapshot(selectedAsset, specs);
      if (!snapshot) {
        setLeadNoError(t('leadAssetError'));
        return;
      }

      setLeadNoLoading(true);
      setLeadNoError(null);
      setLeadNoErrorId(null);
      try {
        const res = await fetch('/api/simulation/lead-asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendor: selectedDealer,
            assetSnapshot: snapshot,
            otrPrice: params.netPrice,
            discount: params.discountAmount,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.leadNo) {
          if (data?.errorId) setLeadNoErrorId(String(data.errorId));
          throw new Error(data?.error || t('leadAssetError'));
        }
        setLeadNo(data.leadNo);
      } catch (err) {
        setLeadNoError(
          err instanceof Error && err.message ? err.message : t('leadAssetError')
        );
      } finally {
        setLeadNoLoading(false);
      }
    },
    [selectedDealer, selectedAsset, specs, buildLeadAssetSnapshot, t]
  );

  const handlePriceComplete = async (netPrice: number, discountAmount: number) => {
    setOtrPrice(netPrice);
    setDiscount(discountAmount);
    setCurrentStep(5);
    setLeadNo(null);
    await requestLeadAsset({ netPrice, discountAmount });
  };

  const handleRetryLeadAsset = useCallback(() => {
    if (otrPrice == null) return;
    void requestLeadAsset({ netPrice: otrPrice, discountAmount: discount });
  }, [otrPrice, discount, requestLeadAsset]);

  const handleProductSelect = (product: ProductCalculation) => {
    setSelectedProduct(product);
  };

  const leadAssetSnapshot: LeadAssetSnapshot | null = selectedAsset
    ? buildLeadAssetSnapshot(selectedAsset, specs)
    : null;

  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const canGoToStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return !!selectedDealer;
      case 3:
        return !!selectedDealer && !!selectedAsset;
      case 4:
        return !!selectedDealer && !!selectedAsset && !!specs.fscCode;
      case 5:
        return !!selectedDealer && !!selectedAsset && !!specs.fscCode && !!otrPrice;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">{t('title')}</h1>
          <p className="text-gray-500">{t('subtitle')}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[
              { num: 1, label: t('stepDealer') },
              { num: 2, label: t('stepModel') },
              { num: 3, label: t('stepSpec') },
              { num: 4, label: t('stepPrice') },
              { num: 5, label: t('stepResult') },
            ].map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => canGoToStep(step.num as Step) && goToStep(step.num as Step)}
                  disabled={!canGoToStep(step.num as Step)}
                  className={`flex flex-col items-center group ${
                    currentStep === step.num
                      ? ''
                      : canGoToStep(step.num as Step)
                      ? ''
                      : 'text-gray-500 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold mb-1 transition ${
                      currentStep === step.num
                        ? 'border-[#002c5f] bg-[#002c5f] text-white'
                        : canGoToStep(step.num as Step)
                        ? 'border-gray-500 group-hover:border-blue-400 transition-colors duration-300 text-gray-500 group-hover:text-blue-400 cursor-pointer'
                        : 'border-gray-500 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {step.num}
                  </div>
                  <span className="text-xs text-gray-500 group-hover:text-blue-400 transition-colors duration-300">{step.label}</span>
                </button>
                {index < 4 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 mb-5 ${
                      currentStep > step.num
                        ? 'bg-[#002c5f]'
                        : 'bg-[var(--border)]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {currentStep >= 3 && selectedDealer && selectedAsset ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-4 lg:gap-4">
            <div className="hidden lg:block">
              <SimulationSidebar
                dealer={selectedDealer}
                asset={selectedAsset}
                specs={specs}
                onChangeModel={() => goToStep(2)}
              />
            </div>
            <div className="space-y-6">
              {/* Mobile: ringkasan singkat + Ganti Model */}
              <div className="lg:hidden flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{selectedAsset.AssetName}</span>
                  {specs.trimName && <span className="text-gray-500"> · {specs.trimName}</span>}
                  <span className="text-gray-500"> · {selectedDealer.City}, {selectedDealer.VendorName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="text-sm font-medium text-[#002c5f] hover:underline"
                >
                  {t('changeModel')}
                </button>
              </div>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 md:p-6 shadow-lg">
                {currentStep === 3 && (
                  <SpecificationStep
                    modelCode={selectedAsset.AssetCode}
                    dealerCode={selectedDealer.VendorCode}
                    onComplete={handleSpecsComplete}
                    initialSpecs={specs}
                  />
                )}
                {currentStep === 4 && (
                  <PriceStep
                    modelName={selectedAsset.AssetName}
                    suggestedPrice={selectedAsset.Price}
                    onComplete={handlePriceComplete}
                  />
                )}
                {currentStep === 5 && leadNoLoading && (
                  <div className="text-center py-12 text-gray-900">
                    <div className="inline-flex items-center gap-3 text-gray-500">
                      <span className="inline-block w-4 h-4 border-2 border-[#002c5f] border-t-transparent rounded-full animate-spin" />
                      {t('leadAssetLoading')}
                    </div>
                  </div>
                )}
                {currentStep === 5 && !leadNoLoading && leadNoError && (
                  <SimulationRetryError
                    title={t('errorTitle')}
                    message={leadNoError}
                    hint={t('errorRetryHint')}
                    secondaryHint={t('errorRetrySecondaryHint')}
                    retryLabel={t('leadAssetRetry')}
                    onRetry={handleRetryLeadAsset}
                    retrying={leadNoLoading}
                    errorId={leadNoErrorId}
                  />
                )}
                {currentStep === 5 && !leadNoLoading && !leadNoError && leadNo && (
                  <ResultStep
                    leadNo={leadNo}
                    otrPrice={otrPrice ?? undefined}
                    discount={discount}
                    dealer={selectedDealer}
                    userLocation={userLocation}
                    vehicle={
                      specs.trimName || specs.exteriorColorName || specs.interiorColorName
                        ? {
                            modelName: specs.manufacturingYear
                              ? `${specs.manufacturingYear} ${selectedAsset.AssetName}`
                              : selectedAsset.AssetName,
                            trimName: specs.trimName,
                            exteriorColor: specs.exteriorColorName,
                            interiorColor: specs.interiorColorName,
                          }
                        : undefined
                    }
                    assetSnapshot={leadAssetSnapshot}
                    onSelectProduct={handleProductSelect}
                  />
                )}
              </div>
              {currentStep > 1 && (
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep((currentStep - 1) as Step)}
                    className="px-6 py-3 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-300 cursor-pointer"
                  >
                    {t('back')}
                  </button>
                  {currentStep < 5 && (
                    <div className="text-sm text-[var(--muted)] flex items-center">
                      {t('stepOf', { current: currentStep })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 md:p-8 shadow-lg">
              {currentStep === 1 && (
                <DealerStep
                  onContinue={handleDealerSelect}
                  selectedDealer={selectedDealer}
                />
              )}
              {currentStep === 2 && selectedDealer && (
                <ModelStep
                  dealerCode={selectedDealer.VendorCode}
                  onSelect={handleAssetSelect}
                  selectedAsset={selectedAsset || undefined}
                />
              )}
            </div>
            {currentStep > 1 && (
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep((currentStep - 1) as Step)}
                  className="px-6 py-3 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-300 cursor-pointer"
                >
                  {t('back')}
                </button>
                {currentStep < 5 && (
                  <div className="text-sm text-[var(--muted)] flex items-center">
                    {t('stepOf', { current: currentStep })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
