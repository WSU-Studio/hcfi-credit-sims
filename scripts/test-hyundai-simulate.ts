/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Standalone diagnostic script.
 * Pakai LeadNo yang sudah ada di tabel `lead_asset_drafts`, lalu:
 *   1) Login Hyundai
 *   2) GetListDefaultProductFromRuleByLeadNo
 *   3) SimulateFinancialCalculate untuk setiap produk yang dikembalikan
 *   4) Print tabel hasil — terlihat produk mana yang LINQ exception.
 *
 * Cara jalankan:
 *   npx tsx --env-file=.env scripts/test-hyundai-simulate.ts <LeadNo> [DpPrcnt] [FirstInstallment] [Tenor]
 *
 * Contoh:
 *   npx tsx --env-file=.env scripts/test-hyundai-simulate.ts 11STGLD20260500022
 *   npx tsx --env-file=.env scripts/test-hyundai-simulate.ts 11STGLD20260500022 25 ADDM 36
 */

const API_BASE_URL =
  process.env.CREDIT_SIMULATION_API_URL ||
  'https://qaapigwconfins.hyundaicapital.co.id/api/mobileloan';

const USERNAME = process.env.CREDIT_SIMULATION_USERNAME;
const PASSWORD = process.env.CREDIT_SIMULATION_PASSWORD;

if (!USERNAME || !PASSWORD) {
  console.error(
    '[FATAL] CREDIT_SIMULATION_USERNAME / CREDIT_SIMULATION_PASSWORD belum ter-set.\n' +
      'Pastikan jalankan script dengan: npx tsx --env-file=.env scripts/test-hyundai-simulate.ts <LeadNo>'
  );
  process.exit(1);
}

// Skip args yang diawali '#' (zsh tanpa interactive_comments meneruskan komentar sebagai argv).
const args = process.argv.slice(2).filter((a) => !a.startsWith('#'));
const leadNo = args[0];
const dpPrcntRaw = args[1] ? Number(args[1]) : 25;
const dpPrcnt = Number.isFinite(dpPrcntRaw) ? dpPrcntRaw : 25;
const firstInstallmentRaw = args[2];
const firstInstallment =
  firstInstallmentRaw === 'ADDM' || firstInstallmentRaw === 'ADDB' ? firstInstallmentRaw : 'ADDM';
const tenorRaw = args[3] ? Number(args[3]) : 36;
const tenor = Number.isFinite(tenorRaw) ? tenorRaw : 36;

if (!leadNo) {
  console.error('Usage: npx tsx --env-file=.env scripts/test-hyundai-simulate.ts <LeadNo> [DpPrcnt] [FirstInstallment] [Tenor]');
  process.exit(1);
}

function describeFetchError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const parts: string[] = [err.message];
  let cause: unknown = (err as any).cause;
  while (cause) {
    if (cause instanceof Error) {
      const code = (cause as any).code ? ` [${(cause as any).code}]` : '';
      parts.push(`caused by: ${cause.message}${code}`);
      cause = (cause as any).cause;
    } else {
      parts.push(`caused by: ${String(cause)}`);
      cause = null;
    }
  }
  return parts.join('\n   ');
}

async function login(): Promise<string> {
  const url = `${API_BASE_URL}/v3/Auth/Login`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD, IsRememberMe: true }),
    });
  } catch (err) {
    throw new Error(
      `Network error saat login ke ${url}\n   ${describeFetchError(err)}\n   ` +
        'Cek: VPN/proxy aktif? DNS resolve hostname? IP whitelisted di Hyundai? Apa Next.js dev sukses login dari mesin yang sama?'
    );
  }
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Login response bukan JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
  const token = data?.Token;
  if (!token) throw new Error(`Login gagal — token kosong (HTTP ${res.status}). Response: ${text.slice(0, 300)}`);
  return token;
}

async function hyundaiPost(path: string, token: string, body: Record<string, unknown>) {
  const url = `${API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AdInsKey: token,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      statusCode: undefined,
      message: '',
      detail: '',
      errorId: null as string | null,
      errorMsg: `Network error: ${describeFetchError(err)}`,
      data: null,
    };
  }
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    return { ok: false, status: res.status, raw: text, errorId: null as string | null, errorMsg: text.slice(0, 400) };
  }
  const headerErrors: string[] = data?.HeaderObj?.ErrorMessages ?? data?.ErrorMessages ?? [];
  const detail = Array.isArray(headerErrors) ? headerErrors.filter(Boolean).join('; ') : '';
  const status = data?.StatusCode ?? data?.HeaderObj?.StatusCode;
  const errorIdMatch = detail.match(/Error ID\s*:\s*([0-9a-f-]{8,})/i);
  const errorId = errorIdMatch ? errorIdMatch[1] : null;
  const ok = res.ok && (!status || status === '200');
  return {
    ok,
    status: res.status,
    statusCode: status,
    message: data?.Message,
    detail,
    errorId,
    errorMsg: !ok ? `${data?.Message || 'Error'}${detail ? ` — ${detail}` : ''}` : '',
    data,
  };
}

function pad(s: string | number, n: number) {
  const str = String(s);
  return str.length >= n ? str.slice(0, n) : str + ' '.repeat(n - str.length);
}

async function main() {
  console.log('========================================');
  console.log(' HYUNDAI SIMULATE DIAGNOSTIC');
  console.log('========================================');
  console.log(`LeadNo           : ${leadNo}`);
  console.log(`DpPrcnt          : ${dpPrcnt}`);
  console.log(`FirstInstallment : ${firstInstallment}`);
  console.log(`Tenor            : ${tenor}`);
  console.log(`API base         : ${API_BASE_URL}`);
  console.log(`Node version     : ${process.version}`);
  console.log();

  console.log('-> [1/5] Login Hyundai...');
  const token = await login();
  console.log('   OK (token cached)\n');

  console.log('-> [2/5] GetLeadAssetSummaryInfoByLeadNo (cek apakah LeadNo masih hidup)...');
  const summaryRes = await hyundaiPost(
    '/v1/IntegrationWebsite/GetLeadAssetSummaryInfoByLeadNo',
    token,
    {
      requestDateTime: new Date().toISOString(),
      rowVersion: '',
      leadNo,
      mrChannelCode: 'WEBSITE',
    }
  );
  if (!summaryRes.ok) {
    console.error('   FAILED:', summaryRes.errorMsg);
    if (summaryRes.errorId) console.error('   Hyundai Error ID:', summaryRes.errorId);
    console.error('   -> LeadNo kemungkinan sudah expired atau invalid. Buat LeadNo baru lewat UI.');
    process.exit(2);
  }
  const summary = summaryRes.data?.ReturnObject ?? summaryRes.data ?? {};
  console.log(`   OK — Asset: ${summary?.AssetLv2Name ?? '?'} / ${summary?.AssetLv3Name ?? '?'}, Dealer: ${summary?.DealerName ?? '?'}, Submitted: ${summary?.DateSubmitted ?? '?'}\n`);

  console.log('-> [3/5] GetListDefaultProductFromRuleByLeadNo...');
  const listRes = await hyundaiPost(
    '/v1/IntegrationWebsite/GetListDefaultProductFromRuleByLeadNo',
    token,
    {
      requestDateTime: new Date().toISOString(),
      rowVersion: '',
      LeadNo: leadNo,
    }
  );
  if (!listRes.ok) {
    console.error('   FAILED:', listRes.errorMsg);
    if (listRes.errorId) console.error('   Hyundai Error ID:', listRes.errorId);
    process.exit(2);
  }
  const standard: any[] = listRes.data?.ListDefaultStandardProductObj ?? [];
  const promo: any[] = listRes.data?.ListDefaultPromotionProductObj ?? [];
  console.log(`   OK — standard: ${standard.length}, promotion: ${promo.length}\n`);

  type Combo = { code: string; name: string; isPromotion: boolean; otr: number; tdpHint?: number };
  const combos: Combo[] = [
    ...standard.map((p) => ({
      code: String(p.ProductCode),
      name: String(p.ProductName),
      isPromotion: false,
      otr: Number(p.TdpAmt) || 0,
      tdpHint: Number(p.TdpAmt) || undefined,
    })),
    ...promo.map((p) => ({
      code: String(p.ProductCode),
      name: String(p.ProductName),
      isPromotion: true,
      otr: Number(p.TdpAmt) || 0,
      tdpHint: Number(p.TdpAmt) || undefined,
    })),
  ];

  // Use 814_300_000 (sesuai data draft user) atau ambil dari TdpAmt produk pertama * faktor.
  // Untuk konsistensi pakai OTR fix 814_300_000 — sesuai LeadAssetDraft yang user kasih.
  const otrPrice = 814_300_000;
  const dpAmt = Math.round((otrPrice * dpPrcnt) / 100);

  console.log(`-> [4/5] CalculateProductFromRule + [5/5] SimulateFinancialCalculate untuk ${combos.length} kombinasi`);
  console.log(`   (otrPrice=${otrPrice.toLocaleString('id-ID')}, dpAmt=${dpAmt.toLocaleString('id-ID')})\n`);

  console.log(pad('CODE', 8) + pad('NAME', 36) + pad('PROMO', 7) + pad('CALC', 12) + pad('SIM', 12) + 'DETAIL');
  console.log('-'.repeat(120));

  type Result = {
    code: string;
    name: string;
    isPromo: boolean;
    calcOk: boolean;
    calcMsg: string;
    calcErrorId: string | null;
    simOk: boolean;
    simMsg: string;
    simErrorId: string | null;
    simRaw?: any;
  };
  const results: Result[] = [];
  for (const c of combos) {
    const baseBody = {
      requestDateTime: new Date().toISOString(),
      rowVersion: '',
      LeadNo: leadNo,
      DpPrcnt: dpPrcnt,
      DpAmt: dpAmt,
      ProductCode: c.code,
      ProductName: c.name,
      IsPromotion: c.isPromotion,
    };

    // Step 4: Calculate Product From Rule (mungkin prime state di Hyundai DB)
    const calcR = await hyundaiPost(
      '/v1/IntegrationWebsite/CalculateProductFromRule',
      token,
      baseBody
    );

    // Step 5: Simulate (cuma dijalankan kalau Calculate OK supaya kita tahu chain effect-nya)
    // NOTE (2026-06-03): MrChannelCode wajib — tanpa field ini Hyundai balas
    // HTTP 500 LINQ exception. Konfirmasi dari tim Hyundai, belum ter-dokumentasi
    // di Postman collection v1.1.
    let simR: Awaited<ReturnType<typeof hyundaiPost>>;
    if (calcR.ok) {
      simR = await hyundaiPost('/v1/IntegrationWebsite/SimulateFinancialCalculate', token, {
        ...baseBody,
        FirstInstallment: firstInstallment,
        Tenor: tenor,
        MrChannelCode: 'WEBSITE',
      });
    } else {
      simR = {
        ok: false,
        status: 0,
        statusCode: undefined,
        message: '',
        detail: '',
        errorId: null,
        errorMsg: 'skipped (calculate failed)',
        data: null,
      };
    }

    let detail = '';
    if (simR.ok) {
      const rows: any[] = simR.data?.ListProductObj ?? [];
      const first = rows[0];
      const installment = first?.InstallmentAmt ? Number(first.InstallmentAmt).toLocaleString('id-ID') : '-';
      detail = `OK — ${rows.length} row(s), installment ${installment}`;
    } else if (!calcR.ok) {
      detail = `CALC FAIL${calcR.errorId ? ` [Ref: ${calcR.errorId}]` : ''}`;
    } else {
      detail = `SIM FAIL${simR.errorId ? ` [Ref: ${simR.errorId}]` : ''}`;
    }

    console.log(
      pad(c.code, 8) +
        pad(c.name, 36) +
        pad(c.isPromotion ? 'YES' : 'no', 7) +
        pad(calcR.ok ? 'OK' : 'FAIL', 12) +
        pad(simR.ok ? 'OK' : 'FAIL', 12) +
        detail
    );

    results.push({
      code: c.code,
      name: c.name,
      isPromo: c.isPromotion,
      calcOk: calcR.ok,
      calcMsg: calcR.errorMsg,
      calcErrorId: calcR.errorId,
      simOk: simR.ok,
      simMsg: simR.errorMsg,
      simErrorId: simR.errorId,
      simRaw: simR.data,
    });
  }

  console.log('\n========================================');
  const calcOk = results.filter((r) => r.calcOk).length;
  const simOk = results.filter((r) => r.simOk).length;
  console.log(` Calculate : ${calcOk} OK, ${results.length - calcOk} FAIL`);
  console.log(` Simulate  : ${simOk} OK, ${results.length - simOk} FAIL`);
  console.log('========================================');

  // Diagnostic: cari combo pertama yang gagal untuk print detail lengkap
  const firstSimFail = results.find((r) => !r.simOk && r.calcOk);
  const firstCalcFail = results.find((r) => !r.calcOk);
  if (firstCalcFail) {
    console.log('\n=== Detail Calculate gagal pertama ===');
    console.log(`Combo  : ${firstCalcFail.code} / ${firstCalcFail.name}${firstCalcFail.isPromo ? ' (promo)' : ''}`);
    console.log(`Message: ${firstCalcFail.calcMsg}`);
  }
  if (firstSimFail) {
    console.log('\n=== Detail Simulate gagal pertama (Calculate sukses) ===');
    console.log(`Combo  : ${firstSimFail.code} / ${firstSimFail.name}${firstSimFail.isPromo ? ' (promo)' : ''}`);
    console.log(`Message: ${firstSimFail.simMsg}`);
    console.log('\nFull response body:');
    try {
      console.log(JSON.stringify(firstSimFail.simRaw, null, 2));
    } catch {
      console.log(String(firstSimFail.simRaw));
    }
  }
}

main().catch((err) => {
  console.error('\n[FATAL]', err instanceof Error ? err.message : err);
  process.exit(1);
});
