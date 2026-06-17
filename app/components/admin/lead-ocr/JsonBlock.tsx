type JsonBlockProps = {
  value: unknown;
  maxHeightClass?: string;
};

/**
 * Read-only JSON viewer dengan styling konsisten untuk panel OCR (debug
 * raw response Hyundai, payload AddLeadCust, dll).
 */
export function JsonBlock({ value, maxHeightClass = 'max-h-64' }: JsonBlockProps) {
  if (value == null) return <span className="text-gray-400">—</span>;
  return (
    <pre
      className={`text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-auto ${maxHeightClass}`}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
