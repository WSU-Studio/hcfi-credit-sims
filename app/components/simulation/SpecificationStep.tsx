'use client';

import { useEffect, useState } from 'react';
import type { KeyValuePair, ManufacturingYear, AssetVariant, ExteriorColor, InteriorColor } from '@/app/types/credit-simulation';

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

  const [loading, setLoading] = useState(false);

  // Fetch manufacturing years
  useEffect(() => {
    if (modelCode && dealerCode) {
      fetchManufacturingYears();
    }
  }, [modelCode, dealerCode]);

  // Fetch variants when year is selected
  useEffect(() => {
    if (selectedYear && modelCode && dealerCode) {
      fetchVariants();
      setSelectedVariant('');
      setSelectedExtColor('');
      setSelectedIntColor('');
    }
  }, [selectedYear, modelCode, dealerCode]);

  // Fetch exterior colors when variant is selected
  useEffect(() => {
    if (selectedVariant && selectedYear) {
      fetchExteriorColors();
      setSelectedExtColor('');
      setSelectedIntColor('');
    }
  }, [selectedVariant, selectedYear]);

  // Fetch interior colors when exterior color is selected
  useEffect(() => {
    if (selectedExtColor && selectedVariant && selectedYear) {
      fetchInteriorColors();
      setSelectedIntColor('');
    }
  }, [selectedExtColor, selectedVariant, selectedYear]);

  // Auto-complete when all are selected
  useEffect(() => {
    if (selectedYear && selectedVariant && selectedExtColor && selectedIntColor) {
      const variant = variants.find(v => v.Key === selectedVariant);
      const extColor = exteriorColors.find(c => c.Key === selectedExtColor);
      const intColor = interiorColors.find(c => c.Key === selectedIntColor);

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
    }
  }, [selectedYear, selectedVariant, selectedExtColor, selectedIntColor]);

  const fetchManufacturingYears = async () => {
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
    }
  };

  const fetchVariants = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const fetchExteriorColors = async () => {
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
    }
  };

  const fetchInteriorColors = async () => {
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
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Pilih Spesifikasi</h2>
        <p className="text-[var(--muted)]">Pilih tahun produksi, varian, dan warna kendaraan</p>
      </div>

      <div className="space-y-6">
        {/* Manufacturing Year */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Tahun Produksi <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:ring-2 focus:ring-[#008AEC]"
            required
          >
            <option value="">Pilih Tahun Produksi</option>
            {manufacturingYears.map((year) => (
              <option key={year.Key} value={year.Key}>{year.Value}</option>
            ))}
          </select>
        </div>

        {/* Variant/Trim */}
        {selectedYear && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Varian/Trim <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="text-[var(--muted)]">Memuat varian...</div>
            ) : (
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:ring-2 focus:ring-[#008AEC]"
                required
                disabled={!selectedYear}
              >
                <option value="">Pilih Varian</option>
                {variants.map((variant) => (
                  <option key={variant.Key} value={variant.Key}>{variant.Value}</option>
                ))}
              </select>
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
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:ring-2 focus:ring-[#008AEC]"
              required
              disabled={!selectedVariant}
            >
              <option value="">Pilih Warna Eksterior</option>
              {exteriorColors.map((color) => (
                <option key={color.Key} value={color.Key}>{color.Value}</option>
              ))}
            </select>
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
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:ring-2 focus:ring-[#008AEC]"
              required
              disabled={!selectedExtColor}
            >
              <option value="">Pilih Warna Interior</option>
              {interiorColors.map((color) => (
                <option key={color.Key} value={color.Key}>{color.Value}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
