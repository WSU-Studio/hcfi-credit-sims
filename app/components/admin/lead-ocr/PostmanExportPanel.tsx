'use client';

import { useMemo, useState } from 'react';
import {
  IconCopy,
  IconCheck,
  IconDownload,
  IconTerminal2,
  IconBraces,
  IconLink,
  IconKey,
} from '@tabler/icons-react';

export type OcrRequestExport = {
  url: string;
  method: 'POST' | string;
  headers: Record<string, string>;
  body: {
    trxNo: string;
    fileName: string;
    source: string;
    byteBase64: string;
  };
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function buildCurl(req: OcrRequestExport, bodyJson: string): string {
  const lines = [`curl --location ${shellQuote(req.url)} \\`, `  --request ${req.method} \\`];
  for (const [k, v] of Object.entries(req.headers)) {
    lines.push(`  --header ${shellQuote(`${k}: ${v}`)} \\`);
  }
  lines.push(`  --data-raw ${shellQuote(bodyJson)}`);
  return lines.join('\n');
}

function CopyButton({
  getValue,
  label = 'Copy',
  size = 'sm',
}: {
  getValue: () => string;
  label?: string;
  size?: 'sm' | 'md';
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(getValue());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('clipboard error', err);
    }
  };
  const cls =
    size === 'md'
      ? 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      : 'inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50';
  return (
    <button type="button" onClick={onCopy} className={cls}>
      {copied ? (
        <>
          <IconCheck size={14} className="text-green-600" /> Tersalin
        </>
      ) : (
        <>
          <IconCopy size={14} /> {label}
        </>
      )}
    </button>
  );
}

function maskedBase64(b64: string): string {
  if (b64.length <= 80) return b64;
  return `${b64.slice(0, 60)}…  ⟨+${b64.length - 60} chars⟩`;
}

/**
 * Tampilkan bahan request OCR dalam format yang gampang di-port ke Postman /
 * dikirim ke tim Hyundai untuk troubleshooting.
 */
export function PostmanExportPanel({ request }: { request: OcrRequestExport }) {
  const bodyJsonFull = useMemo(
    () => JSON.stringify(request.body, null, 2),
    [request.body]
  );
  const bodyJsonCompact = useMemo(
    () => JSON.stringify(request.body),
    [request.body]
  );
  const bodySizeKb = bodyJsonCompact.length;

  const downloadBodyJson = () => {
    const blob = new Blob([bodyJsonFull], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const safeTrx = request.body.trxNo.replace(/[^A-Za-z0-9_-]/g, '_');
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-request-${safeTrx}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-lg border border-blue-200 bg-blue-50/30">
      <header className="flex items-start gap-3 px-4 py-3 border-b border-blue-200 bg-blue-50/60 rounded-t-lg">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-600 text-white shrink-0">
          <IconTerminal2 size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-blue-900">
            Replikasi cURL
          </h3>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadBodyJson}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md border border-blue-300 bg-white text-blue-700 hover:bg-blue-50"
          >
            <IconDownload size={14} /> Download body.json
            <span className="text-blue-500/80">({formatBytes(bodySizeKb)})</span>
          </button>
          <CopyButton
            getValue={() => bodyJsonFull}
            label="Copy body JSON (full)"
            size="md"
          />
          <CopyButton
            getValue={() => buildCurl(request, bodyJsonCompact)}
            label="Copy as cURL"
            size="md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[max-content_1fr] gap-x-4 gap-y-2 items-start text-xs">
          <div className="text-gray-500 flex items-center gap-1.5 pt-2">
            <IconLink size={14} /> URL
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <code className="flex-1 min-w-0 font-mono break-all bg-white border border-gray-200 rounded-md px-3 py-2">
              <span className="inline-block px-1.5 py-0.5 mr-2 rounded bg-blue-100 text-blue-700 text-[10px] font-semibold">
                {request.method}
              </span>
              {request.url}
            </code>
            <CopyButton getValue={() => request.url} />
          </div>

          <div className="text-gray-500 flex items-center gap-1.5 pt-2">
            <IconKey size={14} /> Headers
          </div>
          <div className="space-y-1.5">
            {Object.entries(request.headers).map(([key, value]) => {
              const isToken = key.toLowerCase() === 'adinskey';
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-1.5"
                >
                  <span className="font-mono text-[11px] text-gray-500 shrink-0">
                    {key}
                  </span>
                  <code
                    className={`flex-1 min-w-0 font-mono break-all ${
                      isToken ? 'text-amber-700' : 'text-gray-800'
                    }`}
                  >
                    {value}
                  </code>
                  <CopyButton getValue={() => value} />
                </div>
              );
            })}
            <p className="text-[11px] text-amber-700">
              Token <span className="font-mono">AdInsKey</span> berlaku ±50 menit. Kalau
              sudah expired, jalankan ulang tes ini untuk dapat token baru.
            </p>
          </div>

          <div className="text-gray-500 flex items-center gap-1.5 pt-2">
            <IconBraces size={14} /> Body
          </div>
          <div className="space-y-2">
            <div className="bg-white border border-gray-200 rounded-md p-3 text-[11px] font-mono text-gray-800">
              <div className="space-y-1">
                <div>
                  <span className="text-gray-500">trxNo</span>: &quot;{request.body.trxNo}&quot;
                </div>
                <div>
                  <span className="text-gray-500">fileName</span>: &quot;{request.body.fileName}&quot;
                </div>
                <div>
                  <span className="text-gray-500">source</span>: &quot;{request.body.source}&quot;
                </div>
                <div>
                  <span className="text-gray-500">byteBase64</span>:{' '}
                  <span className="text-gray-500">
                    &quot;{maskedBase64(request.body.byteBase64)}&quot;
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                Total panjang base64: {request.body.byteBase64.length.toLocaleString('id-ID')} chars · pakai
                tombol di atas untuk dapat versi lengkap.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
