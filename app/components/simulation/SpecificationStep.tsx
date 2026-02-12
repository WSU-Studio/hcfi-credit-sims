'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ManufacturingYear, AssetVariant, ExteriorColor, InteriorColor } from '@/app/types/credit-simulation';

interface SpecificationStepProps {
  modelCode: string;
  dealerCode: string;
  onComplete: (specs: {
    manufacturingYear: number;
    fscCode: string;
    trimName: string;
    exteriorColorCode: string;
    exteriorColorName: string;
    interiorColorCode: string;
    interiorColorName: string;
  }) => void;
  initialSpecs?: {
    manufacturingYear?: number;
    fscCode?: string;
    trimName?: string;
    exteriorColorCode?: string;
    exteriorColorName?: string;
    interiorColorCode?: string;
    interiorColorName?: string;
  };
}

export function SpecificationStep({ modelCode, dealerCode, onComplete, initialSpecs }: SpecificationStepProps) {
  const [manufacturingYears, setManufacturingYears] = useState<ManufacturingYear[]>([]);
  const [variants, setVariants] = useState<AssetVariant[]>([]);
  const [exteriorColors, setExteriorColors] = useState<ExteriorColor[]>([]);
  const [interiorColors, setInteriorColors] = useState<InteriorColor[]>([]);

  const [selectedYear, setSelectedYear] = useState<number | ''>(initialSpecs?.manufacturingYear || '');
  const [selectedVariant, setSelectedVariant] = useState<string>(initialSpecs?.fscCode || '');
  const [selectedExtColor, setSelectedExtColor] = useState<string>(initialSpecs?.exteriorColorCode || '');
  const [selectedIntColor, setSelectedIntColor] = useState<string>(initialSpecs?.interiorColorCode || '');

  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [loadingExterior, setLoadingExterior] = useState(false);
  const [loadingInterior, setLoadingInterior] = useState(false);

  const fetchManufacturingYears = useCallback(async () => {
    setLoadingYears(true);
    try {
      const response = await fetch('/api/simulation/manufacturing-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ModelCode: modelCode, DealerCode: dealerCode }),
      });
      const data = await response.json();
      if (data.ReturnObject) setManufacturingYears(data.ReturnObject);
    } catch (err) {
      console.error('Error fetching manufacturing years:', err);
    } finally {
      setLoadingYears(false);
    }
  }, [modelCode, dealerCode]);

  const fetchVariants = useCallback(async () => {
    setLoadingVariants(true);
    try {
      const response = await fetch('/api/simulation/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ModelCode: modelCode, DealerCode: dealerCode, ManufYear: selectedYear }),
      });
      const data = await response.json();
      if (data.ReturnObject) setVariants(data.ReturnObject);
    } catch (err) {
      console.error('Error fetching variants:', err);
    } finally {
      setLoadingVariants(false);
    }
  }, [modelCode, dealerCode, selectedYear]);

  const fetchExteriorColors = useCallback(async () => {
    setLoadingExterior(true);
    try {
      const response = await fetch('/api/simulation/colors/exterior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ FscCode: selectedVariant, ManufYear: selectedYear }),
      });
      const data = await response.json();
      if (data.ReturnObject) setExteriorColors(data.ReturnObject);
    } catch (err) {
      console.error('Error fetching exterior colors:', err);
    } finally {
      setLoadingExterior(false);
    }
  }, [selectedVariant, selectedYear]);

  const fetchInteriorColors = useCallback(async () => {
    setLoadingInterior(true);
    try {
      const response = await fetch('/api/simulation/colors/interior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          FscCode: selectedVariant,
          ManufYear: selectedYear,
          ExtColorCode: selectedExtColor,
        }),
      });
      const data = await response.json();
      if (data.ReturnObject) setInteriorColors(data.ReturnObject);
    } catch (err) {
      console.error('Error fetching interior colors:', err);
    } finally {
      setLoadingInterior(false);
    }
  }, [selectedExtColor, selectedVariant, selectedYear]);

  // Fetch manufacturing years
  useEffect(() => {
    if (modelCode && dealerCode) {
      fetchManufacturingYears();
    }
  }, [modelCode, dealerCode, fetchManufacturingYears]);

  // Fetch variants when year is selected
  useEffect(() => {
    if (selectedYear && modelCode && dealerCode) {
      fetchVariants();
      // Reset dependent fields when year changes (unless they're in initialSpecs)
      if (initialSpecs?.manufacturingYear !== selectedYear) {
        setSelectedVariant(initialSpecs?.fscCode || '');
        setSelectedExtColor(initialSpecs?.exteriorColorCode || '');
        setSelectedIntColor(initialSpecs?.interiorColorCode || '');
      }
    }
  }, [selectedYear, modelCode, dealerCode, fetchVariants, initialSpecs]);

  // Fetch exterior colors when variant is selected
  useEffect(() => {
    if (selectedVariant && selectedYear) {
      fetchExteriorColors();
      // Reset dependent fields when variant changes (unless they're in initialSpecs)
      if (initialSpecs?.fscCode !== selectedVariant) {
        setSelectedExtColor(initialSpecs?.exteriorColorCode || '');
        setSelectedIntColor(initialSpecs?.interiorColorCode || '');
      }
    }
  }, [selectedVariant, selectedYear, fetchExteriorColors, initialSpecs]);

  // Fetch interior colors when exterior color is selected
  useEffect(() => {
    if (selectedExtColor && selectedVariant && selectedYear) {
      fetchInteriorColors();
    }
  }, [selectedExtColor, selectedVariant, selectedYear, fetchInteriorColors]);

  // Validate and reset interior color if it's not available for the new exterior color
  useEffect(() => {
    if (interiorColors.length > 0 && selectedIntColor) {
      const isValidColor = interiorColors.some((c) => c.Key === selectedIntColor);
      if (!isValidColor) {
        // Reset if current selection is not in the new list
        setSelectedIntColor('');
      }
    }
  }, [interiorColors, selectedIntColor]);

  const handleContinue = () => {
    // Validate all fields are filled
    if (!selectedYear || !selectedVariant || !selectedExtColor || !selectedIntColor) {
      return;
    }

    const variant = variants.find((v) => v.Key === selectedVariant);
    const extColor = exteriorColors.find((c) => c.Key === selectedExtColor);
    const intColor = interiorColors.find((c) => c.Key === selectedIntColor);

    if (variant && extColor && intColor) {
      onComplete({
        manufacturingYear: selectedYear as number,
        fscCode: selectedVariant,
        trimName: variant.Value,
        exteriorColorCode: selectedExtColor,
        exteriorColorName: extColor.Value,
        interiorColorCode: selectedIntColor,
        interiorColorName: intColor.Value,
      });
    }
  };

  const isFormValid = !!(
    selectedYear &&
    selectedVariant &&
    selectedExtColor &&
    selectedIntColor
  );

  return (
    <div className="space-y-6 text-gray-900">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Pilih Spesifikasi</h2>
        <p className="text-gray-500">Pilih tahun produksi, varian, dan warna kendaraan</p>
      </div>

      <div className="space-y-6 text-gray-900">
        {/* Manufacturing Year */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Tahun Produksi <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] transition disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            required
            disabled={loadingYears}
            aria-busy={loadingYears}
            aria-describedby={loadingYears ? 'loading-years-desc' : undefined}
          >
            <option value="">
              {loadingYears ? 'Memuat tahun produksi...' : 'Pilih Tahun Produksi'}
            </option>
            {!loadingYears &&
              manufacturingYears.map((year) => (
                <option key={year.Key} value={year.Key}>{year.Value}</option>
              ))}
          </select>
          {loadingYears && (
            <p id="loading-years-desc" className="mt-1.5 text-sm text-gray-500">
              Mengambil data tahun produksi...
            </p>
          )}
        </div>

        {/* Variant/Trim */}
        {selectedYear && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Varian/Trim <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] transition disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              required
              disabled={loadingVariants}
              aria-busy={loadingVariants}
              aria-describedby={loadingVariants ? 'loading-variants-desc' : undefined}
            >
              <option value="">
                {loadingVariants ? 'Memuat varian...' : 'Pilih Varian'}
              </option>
              {!loadingVariants &&
                variants.map((variant) => (
                  <option key={variant.Key} value={variant.Key}>{variant.Value}</option>
                ))}
            </select>
            {loadingVariants && (
              <p id="loading-variants-desc" className="mt-1.5 text-sm text-gray-500">
                Mengambil data varian/trim...
              </p>
            )}
          </div>
        )}

        {/* Exterior Color */}
        {selectedVariant && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Warna Eksterior <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedExtColor}
              onChange={(e) => setSelectedExtColor(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] transition disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              required
              disabled={loadingExterior}
              aria-busy={loadingExterior}
              aria-describedby={loadingExterior ? 'loading-exterior-desc' : undefined}
            >
              <option value="">
                {loadingExterior ? 'Memuat warna eksterior...' : 'Pilih Warna Eksterior'}
              </option>
              {!loadingExterior &&
                exteriorColors.map((color) => (
                  <option key={color.Key} value={color.Key}>{color.Value}</option>
                ))}
            </select>
            {loadingExterior && (
              <p id="loading-exterior-desc" className="mt-1.5 text-sm text-gray-500">
                Mengambil data warna eksterior...
              </p>
            )}
          </div>
        )}

        {/* Interior Color */}
        {selectedExtColor && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Warna Interior <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedIntColor}
              onChange={(e) => setSelectedIntColor(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] transition disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              required
              disabled={loadingInterior}
              aria-busy={loadingInterior}
              aria-describedby={loadingInterior ? 'loading-interior-desc' : undefined}
            >
              <option value="">
                {loadingInterior ? 'Memuat warna interior...' : 'Pilih Warna Interior'}
              </option>
              {!loadingInterior &&
                interiorColors.map((color) => (
                  <option key={color.Key} value={color.Key}>{color.Value}</option>
                ))}
            </select>
            {loadingInterior && (
              <p id="loading-interior-desc" className="mt-1.5 text-sm text-gray-500">
                Mengambil data warna interior...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!isFormValid}
          className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer transition-colors duration-300"
        >
          Lanjut ke Harga
        </button>
        {!isFormValid && (
          <p className="mt-2 text-sm text-gray-500 text-center">
            Silakan lengkapi semua field untuk melanjutkan
          </p>
        )}
      </div>
    </div>
  );
}
