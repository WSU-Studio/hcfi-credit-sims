'use client';

export type CreditScoringLabels = {
  sectionTitle: string;
  sectionHint: string;
  citizenTypeLabel: string;
  citizenTypeLocal: string;
  citizenTypeForeigner: string;
  ktpUploadLabel: string;
  ktpUploadLabelForeigner: string;
  browse: string;
  noFileSelected: string;
  ktpUploading: string;
  ktpUploadSuccess: string;
  ktpUploadHint: string;
  ocrProcessing: string;
  ocrShowData: string;
  ocrHideData: string;
  ocrStatusComplete: string;
  ocrStatusIncomplete: string;
  motherNameLabel: string;
  motherNamePlaceholder: string;
  homeOwnershipLabel: string;
  homeOwnershipPlaceholder: string;
  homeOwnershipOwn: string;
  homeOwnershipFamily: string;
  homeOwnershipRent: string;
  homeOwnershipCompany: string;
  homeOwnershipOther: string;
};

export interface CreditScoringFieldsProps {
  labels: CreditScoringLabels;
  citizenType: 'LOCAL' | 'FOREIGNER';
  onCitizenTypeChange: (value: 'LOCAL' | 'FOREIGNER') => void;
  ktpUrl: string | null;
  ktpFileName: string | null;
  ktpUploading: boolean;
  ktpError: string | null;
  ocrLoading: boolean;
  ocrError: string | null;
  isOcrComplete: boolean;
  showOcrForm: boolean;
  onToggleOcrForm: () => void;
  onKtpChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  motherName: string;
  onMotherNameChange: (value: string) => void;
  homeOwnership: string;
  onHomeOwnershipChange: (value: string) => void;
  disabled?: boolean;
  /** When false, inputs are not HTML-required (parent validates). Default true. */
  htmlRequired?: boolean;
}

/**
 * Presentational credit-scoring fields (citizen type, KTP, mother name, home ownership).
 * Upload/OCR side-effects stay in the parent (ContactModal / CompleteLeadScoringModal).
 */
export function CreditScoringFields({
  labels: t,
  citizenType,
  onCitizenTypeChange,
  ktpUrl,
  ktpFileName,
  ktpUploading,
  ktpError,
  ocrLoading,
  ocrError,
  isOcrComplete,
  showOcrForm,
  onToggleOcrForm,
  onKtpChange,
  motherName,
  onMotherNameChange,
  homeOwnership,
  onHomeOwnershipChange,
  disabled = false,
  htmlRequired = true,
}: CreditScoringFieldsProps) {
  return (
    <div className="pt-2 space-y-3 border-t border-gray-200 mt-2">
      <p className="text-sm font-semibold text-gray-900">{t.sectionTitle}</p>
      <p className="text-xs text-gray-500">{t.sectionHint}</p>

      <div className="mb-4 mt-2">
        <p className="text-sm font-medium text-gray-700 mb-1">{t.citizenTypeLabel}</p>
        <div className="flex gap-6">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="citizenType"
              value="LOCAL"
              checked={citizenType === 'LOCAL'}
              onChange={() => onCitizenTypeChange('LOCAL')}
              disabled={disabled}
              className="w-4 h-4 text-[#002c5f] border-gray-300 focus:ring-[#002c5f] disabled:opacity-50"
            />
            <span className="text-sm text-gray-700">{t.citizenTypeLocal}</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="citizenType"
              value="FOREIGNER"
              checked={citizenType === 'FOREIGNER'}
              onChange={() => onCitizenTypeChange('FOREIGNER')}
              disabled={disabled}
              className="w-4 h-4 text-[#002c5f] border-gray-300 focus:ring-[#002c5f] disabled:opacity-50"
            />
            <span className="text-sm text-gray-700">{t.citizenTypeForeigner}</span>
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {citizenType === 'FOREIGNER' ? t.ktpUploadLabelForeigner : t.ktpUploadLabel}{' '}
            <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label
              className={`inline-flex items-center h-11 px-4 rounded-lg bg-[#002c5f] text-white text-sm font-medium cursor-pointer transition-colors ${
                ktpUploading || ocrLoading || disabled
                  ? 'opacity-50 cursor-not-allowed pointer-events-none'
                  : 'hover:bg-[#002c5f]/90'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={onKtpChange}
                disabled={ktpUploading || ocrLoading || disabled}
                className="sr-only"
              />
              {t.browse}
            </label>
            <span className={`text-sm ${ktpUrl ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
              {ktpUploading
                ? t.ktpUploading
                : ocrLoading
                  ? t.ocrProcessing
                  : ktpUrl && ktpFileName
                    ? ktpFileName
                    : t.noFileSelected}
            </span>
          </div>
          {(ktpUploading || ocrLoading) && (
            <p className="mt-1 text-xs text-gray-500">
              {ktpUploading ? t.ktpUploading : t.ocrProcessing}
            </p>
          )}
          {ktpUrl && !ktpUploading && !ocrLoading && (
            <p className="mt-1 text-xs text-green-600">{t.ktpUploadSuccess}</p>
          )}
          {ktpError && <p className="mt-1 text-xs text-red-600">{ktpError}</p>}
          {ocrError && <p className="mt-1 text-xs text-amber-700">{ocrError}</p>}
          <p className="mt-1 text-xs text-gray-500">{t.ktpUploadHint}</p>
          {ktpUrl && !ocrLoading && (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleOcrForm}
                className="text-xs font-medium text-[#002c5f] hover:text-[#002c5f]/80 cursor-pointer border border-gray-300 rounded-lg px-2 py-1"
              >
                {showOcrForm ? t.ocrHideData : t.ocrShowData}
              </button>
              <span
                className={`text-xs font-medium ${isOcrComplete ? 'text-green-600' : 'text-red-600'}`}
              >
                {isOcrComplete ? t.ocrStatusComplete : t.ocrStatusIncomplete}
              </span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="mother-name" className="block text-sm font-medium text-gray-700 mb-1.5">
            {t.motherNameLabel} <span className="text-red-500">*</span>
          </label>
          <input
            id="mother-name"
            type="text"
            value={motherName}
            onChange={(e) => onMotherNameChange(e.target.value)}
            required={htmlRequired}
            disabled={disabled}
            className="w-full px-4 h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder={t.motherNamePlaceholder}
          />
        </div>

        <div>
          <label htmlFor="home-ownership" className="block text-sm font-medium text-gray-700 mb-1.5">
            {t.homeOwnershipLabel} <span className="text-red-500">*</span>
          </label>
          <select
            id="home-ownership"
            value={homeOwnership}
            onChange={(e) => onHomeOwnershipChange(e.target.value)}
            required={htmlRequired}
            disabled={disabled}
            className="w-full h-11 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002c5f] focus:border-[#002c5f] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          >
            <option value="">{t.homeOwnershipPlaceholder}</option>
            <option value="OWN">{t.homeOwnershipOwn}</option>
            <option value="FAMILY">{t.homeOwnershipFamily}</option>
            <option value="RENT">{t.homeOwnershipRent}</option>
            <option value="COMPANY">{t.homeOwnershipCompany}</option>
            <option value="OTHER">{t.homeOwnershipOther}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
