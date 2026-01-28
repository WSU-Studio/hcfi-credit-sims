'use client';

import { useState } from 'react';
import { Container } from '@/app/components/ui/Container';
import { DealerStep } from '@/app/components/simulation/DealerStep';
import { ModelStep } from '@/app/components/simulation/ModelStep';
import { SpecificationStep } from '@/app/components/simulation/SpecificationStep';
import { PriceStep } from '@/app/components/simulation/PriceStep';
import { ResultStep } from '@/app/components/simulation/ResultStep';
import type { Vendor, AssetMaster, ProductCalculation } from '@/app/types/credit-simulation';

type Step = 1 | 2 | 3 | 4 | 5;

export default function SimulasiKreditPage() {
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
  const [leadNo, setLeadNo] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductCalculation | null>(null);

  const handleDealerSelect = (dealer: Vendor) => {
    setSelectedDealer(dealer);
    setCurrentStep(2);
    // Reset subsequent steps
    setSelectedAsset(null);
    setSpecs({});
    setOtrPrice(null);
  };

  const handleAssetSelect = (asset: AssetMaster) => {
    setSelectedAsset(asset);
    setCurrentStep(3);
    // Reset subsequent steps
    setSpecs({});
    setOtrPrice(null);
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
    setOtrPrice(null);
  };

  const handlePriceComplete = async (price: number) => {
    setOtrPrice(price);
    
    // TODO: Create Lead via API first to get LeadNo
    // For now, we'll simulate with a placeholder
    // In production, you would call: POST /v1/IntegrationWebsite/CreateLead
    // and get LeadNo from response
    
    // Mock LeadNo for development
    setLeadNo('MOCK-LEAD-001');
    setCurrentStep(5);
  };

  const handleProductSelect = (product: ProductCalculation) => {
    setSelectedProduct(product);
  };

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
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">Simulasi Kredit Mobil</h1>
          <p className="text-gray-500">Dapatkan estimasi cicilan kredit kendaraan impian Anda</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[
              { num: 1, label: 'Dealer' },
              { num: 2, label: 'Model' },
              { num: 3, label: 'Spesifikasi' },
              { num: 4, label: 'Harga' },
              { num: 5, label: 'Hasil' },
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
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 md:p-8 shadow-lg">
          {currentStep === 1 && (
            <DealerStep
              onSelect={handleDealerSelect}
              selectedDealer={selectedDealer || undefined}
            />
          )}

          {currentStep === 2 && selectedDealer && (
            <ModelStep
              dealerCode={selectedDealer.VendorCode}
              onSelect={handleAssetSelect}
              selectedAsset={selectedAsset || undefined}
            />
          )}

          {currentStep === 3 && selectedDealer && selectedAsset && (
            <SpecificationStep
              modelCode={selectedAsset.AssetCode}
              dealerCode={selectedDealer.VendorCode}
              onComplete={handleSpecsComplete}
              initialSpecs={specs}
            />
          )}

          {currentStep === 4 && selectedAsset && (
            <PriceStep
              modelName={selectedAsset.AssetName}
              suggestedPrice={selectedAsset.Price}
              onComplete={handlePriceComplete}
            />
          )}

          {currentStep === 5 && (
            <ResultStep
              leadNo={leadNo || undefined}
              otrPrice={otrPrice ?? undefined}
              vehicle={
                selectedAsset || specs.trimName || specs.exteriorColorName || specs.interiorColorName
                  ? {
                      modelName: selectedAsset
                        ? (specs.manufacturingYear
                            ? `${specs.manufacturingYear} ${selectedAsset.AssetName}`
                            : selectedAsset.AssetName)
                        : undefined,
                      trimName: specs.trimName,
                      exteriorColor: specs.exteriorColorName,
                      interiorColor: specs.interiorColorName,
                    }
                  : undefined
              }
              onSelectProduct={handleProductSelect}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep > 1 && (
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep((currentStep - 1) as Step)}
              className="px-6 py-3 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-300 cursor-pointer"
            >
              Kembali
            </button>
            {currentStep < 5 && (
              <div className="text-sm text-[var(--muted)] flex items-center">
                Langkah {currentStep} dari 5
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
