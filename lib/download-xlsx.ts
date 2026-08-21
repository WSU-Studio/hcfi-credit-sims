export type SpreadsheetCell = string | number | boolean | Date | null | undefined;

export type SpreadsheetColumn<T extends Record<string, SpreadsheetCell>> = {
  header: string;
  key: keyof T & string;
};

const MAX_COLUMN_WIDTH = 60;

/**
 * Browser-side .xlsx download from columnar row data.
 * Isolated from table UI so export format can change without touching callers.
 */
export async function downloadSpreadsheet<T extends Record<string, SpreadsheetCell>>(options: {
  fileName: string;
  columns: SpreadsheetColumn<T>[];
  rows: T[];
}): Promise<void> {
  const writeExcelFile = (await import('write-excel-file/universal')).default;
  const { fileName, columns, rows } = options;

  const headerRow = columns.map((column) => ({
    value: column.header,
    fontWeight: 'bold' as const,
  }));

  const dataRows = rows.map((row) =>
    columns.map((column) => ({
      value: toCellValue(row[column.key]),
    }))
  );

  const columnWidths = columns.map((column) => ({
    width: Math.min(
      MAX_COLUMN_WIDTH,
      Math.max(
        column.header.length,
        ...rows.map((row) => String(row[column.key] ?? '').length)
      ) + 2
    ),
  }));

  const blob = await writeExcelFile([headerRow, ...dataRows], { columns: columnWidths }).toBlob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

function toCellValue(value: SpreadsheetCell): string | number | boolean | Date {
  if (value == null) return '';
  return value;
}
