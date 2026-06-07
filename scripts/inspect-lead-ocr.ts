/**
 * Diagnostic: cek status Lead + OCR + rekonstruksi payload AddLeadCust
 * untuk satu LeadNo Hyundai dari DB lokal.
 *
 * Pakai:
 *   npx tsx scripts/inspect-lead-ocr.ts 13STGLD20260600008
 */

import { prisma } from '../lib/prisma';
import { mapGender, mapMarital, normalizeBirthDate, type OcrKtpRead } from '../lib/hyundai-ocr';
import { integrationRequestBody } from '../lib/hyundai-integration-request';

const HOME_OWNERSHIP_MAP: Record<string, string> = {
  OWN: 'OWNED',
  OWNED: 'OWNED',
  FAMILY: 'FAMILY',
  RENT: 'RENT',
  COMPANY: 'COMPANY',
  OTHER: 'OTHER',
};

function reconstructAddLeadCustPayload(
  lead: {
    name: string;
    email: string;
    phone: string;
    notes: string | null;
    productName: string | null;
    motherName: string | null;
    homeOwnershipStatus: string | null;
    citizenType: string | null;
  },
  leadNo: string,
  ocr: OcrKtpRead | null,
  location: { zipCode: string; city: string; areaCode1: string; areaCode2: string }
): Record<string, unknown> {
  const nationality =
    ocr?.mrNationalityCode ||
    (lead.citizenType === 'FOREIGNER' ? 'FOREIGNER' : 'LOCAL');
  const houseCode = lead.homeOwnershipStatus
    ? HOME_OWNERSHIP_MAP[lead.homeOwnershipStatus.toUpperCase()] ?? 'OTHER'
    : 'OTHER';

  return integrationRequestBody({
    LeadNo: leadNo,
    IdNo: ocr?.nik?.replace(/\D/g, '').slice(0, 16) || '0000000000000000',
    CustName: (ocr?.nama || lead.name).trim(),
    BirthPlace: ocr?.tempatLahir || '-',
    BirthDt: normalizeBirthDate(ocr?.tanggalLahir),
    MrGenderCode: mapGender(ocr?.jenisKelamin),
    MrMaritalStatCode: mapMarital(ocr?.statusPerkawinan),
    MrReligionCode: (ocr?.agama || 'ISLAM').toUpperCase(),
    MrNationalityCode: nationality,
    NationalityCountryCode: 'ID',
    Addr: ocr?.alamat || '-',
    AreaCode4: ocr?.Rt || '001',
    AreaCode3: ocr?.Rw || '001',
    ZipCode: location.zipCode,
    AreaCode1: location.areaCode1,
    AreaCode2: location.areaCode2,
    City: location.city,
    MrHouseOwnershipCode: houseCode,
    Notes: lead.notes || lead.productName || '',
    IsFamily: false,
    IsCustomer: true,
    IsGuarantor: false,
    MrCustRelationshipCode: 'Customer',
    MobilePhnNo: lead.phone.replace(/\D/g, '').slice(0, 15),
    Email: lead.email,
    MotherMaidenName: lead.motherName || '-',
    MrEducationCode: 'S1',
    NumOfDependent: '0',
    IdFile: '<base64 KTP yang dikirim — di-omit di output diagnostic>',
  });
}

async function main() {
  const leadNoArg = process.argv[2];
  if (!leadNoArg) {
    console.error('Usage: npx tsx scripts/inspect-lead-ocr.ts <leadNo>');
    process.exit(1);
  }

  const lead = await prisma.lead.findFirst({
    where: {
      OR: [
        { hyundaiLeadNo: leadNoArg },
        { simulationLeadNo: leadNoArg },
      ],
    },
  });

  if (!lead) {
    console.log(`\n✗ Lead tidak ditemukan dengan hyundaiLeadNo / simulationLeadNo = ${leadNoArg}\n`);
    process.exit(0);
  }

  console.log('\n=== LEAD RECORD ===');
  console.log({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    simulationLeadNo: lead.simulationLeadNo,
    hyundaiLeadNo: lead.hyundaiLeadNo,
    hyundaiAssignStatus: lead.hyundaiAssignStatus,
    hyundaiAssignError: lead.hyundaiAssignError,
    hyundaiAssignedAt: lead.hyundaiAssignedAt,
    ktpUrl: lead.ktpUrl,
    vendorCode: lead.vendorCode,
    vendorName: lead.vendorName,
    cmoEmpNo: lead.cmoEmpNo,
    cmoName: lead.cmoName,
    productName: lead.productName,
    notes: lead.notes,
    motherName: lead.motherName,
    homeOwnershipStatus: lead.homeOwnershipStatus,
    citizenType: lead.citizenType,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  });

  console.log('\n=== OCR RESULTS (LeadOcrResult) ===');
  const ocrResults = await prisma.leadOcrResult.findMany({
    where: {
      OR: [
        { leadId: lead.id },
        { hyundaiLeadNo: leadNoArg },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!ocrResults.length) {
    console.log('  (tidak ada record OCR — getOcrKtpData mungkin di-skip karena ktpUrl null)');
  } else {
    for (const r of ocrResults) {
      console.log({
        id: r.id,
        hyundaiLeadNo: r.hyundaiLeadNo,
        ktpFileName: r.ktpFileName,
        status: r.status,
        errorMessage: r.errorMessage,
        nik: r.nik,
        nama: r.nama,
        tempatLahir: r.tempatLahir,
        tanggalLahir: r.tanggalLahir,
        jenisKelamin: r.jenisKelamin,
        zipCode: r.zipCode,
        agama: r.agama,
        statusPerkawinan: r.statusPerkawinan,
        mrNationalityCode: r.mrNationalityCode,
        createdAt: r.createdAt,
      });
      console.log('\n  --- rawResponse from Hyundai (verbatim) ---');
      console.log(JSON.stringify(r.rawResponse, null, 2));
    }
  }

  console.log('\n=== HYUNDAI API CALL LOGS (krusial endpoints) ===');
  const apiLogs = await prisma.hyundaiApiCallLog.findMany({
    where: {
      OR: [
        { leadId: lead.id },
        { hyundaiLeadNo: lead.hyundaiLeadNo ?? leadNoArg },
        { hyundaiLeadNo: lead.simulationLeadNo ?? leadNoArg },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!apiLogs.length) {
    console.log('  (belum ada log — submit ulang setelah feature logging aktif)');
  } else {
    for (const log of apiLogs) {
      console.log(`\n  --- [${log.endpoint}] ${log.status} (${log.durationMs ?? '?'}ms, ${log.createdAt.toISOString()}) ---`);
      console.log('  url            :', log.url);
      console.log('  hyundaiStatus  :', log.hyundaiStatus ?? '(null)');
      console.log('  hyundaiMessage :', log.hyundaiMessage ?? '(null)');
      if (log.errorMessage) {
        console.log('  errorMessage   :', log.errorMessage);
      }
      console.log('  requestBody    :', JSON.stringify(log.requestBody, null, 2));
      if (log.responseBody !== null) {
        const rspStr = JSON.stringify(log.responseBody, null, 2);
        console.log('  responseBody   :', rspStr.length > 4000 ? rspStr.slice(0, 4000) + '\n... (truncated)' : rspStr);
      } else {
        console.log('  responseBody   : (null)');
      }
    }
  }

  console.log('\n=== ADD LEAD CUST PAYLOAD (yang dikirim ke Hyundai) ===');
  const persistedPayload = ocrResults[0]?.addLeadCustPayload;
  if (persistedPayload) {
    console.log('  (sumber: persisted di LeadOcrResult.addLeadCustPayload)');
    console.log(JSON.stringify(persistedPayload, null, 2));
  } else {
    console.log('  (sumber: rekonstruksi dari Lead + OCR + dealer fallback)');
    console.log(
      '  Catatan: kalau OCR gagal, sebagian besar field pakai placeholder default.\n'
    );

    // Cari draft simulasi untuk dapat vendor zip (fallback location resolver).
    const draft = lead.simulationLeadNo
      ? await prisma.leadAssetDraft.findFirst({
          where: { hyundaiLeadNo: lead.simulationLeadNo },
          select: {
            vendorCode: true,
            vendorName: true,
            oriOfficeName: true,
          },
        })
      : null;

    const ocr = (ocrResults[0]?.status === 'SUCCESS'
      ? ({
          nik: ocrResults[0].nik ?? undefined,
          nama: ocrResults[0].nama ?? undefined,
          tempatLahir: ocrResults[0].tempatLahir ?? undefined,
          tanggalLahir: ocrResults[0].tanggalLahir ?? undefined,
          jenisKelamin: ocrResults[0].jenisKelamin ?? undefined,
          alamat: undefined,
          Zipcode: ocrResults[0].zipCode ?? undefined,
          agama: ocrResults[0].agama ?? undefined,
          statusPerkawinan: ocrResults[0].statusPerkawinan ?? undefined,
          mrNationalityCode: ocrResults[0].mrNationalityCode ?? undefined,
        } as OcrKtpRead)
      : null);

    const fallbackLocation = {
      zipCode: '00000',
      city: lead.vendorName ?? '-',
      areaCode1: '-',
      areaCode2: '-',
    };

    const payload = reconstructAddLeadCustPayload(
      {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        notes: lead.notes,
        productName: lead.productName,
        motherName: lead.motherName,
        homeOwnershipStatus: lead.homeOwnershipStatus,
        citizenType: lead.citizenType,
      },
      lead.hyundaiLeadNo ?? leadNoArg,
      ocr,
      fallbackLocation
    );

    console.log(JSON.stringify(payload, null, 2));

    if (draft) {
      console.log(
        `\n  ℹ Note: ZipCode/AreaCode di payload sebenarnya di-resolve via Hyundai's GetLocationDataByZipcode dari ZipCode dealer (${draft.vendorName ?? draft.vendorCode}). Untuk lihat persis, perlu jalankan submit ulang setelah fix kode persist payload selalu.`
      );
    }
  }

  console.log('\n=== DIAGNOSIS ===');
  if (!lead.ktpUrl) {
    console.log('  ⚠ Lead.ktpUrl = null → KTP belum di-upload user.');
    console.log('     Konsekuensi: getOcrKtpData TIDAK dipanggil (skip block).');
    console.log('     buildAddLeadCustBody pakai placeholder default:');
    console.log('       IdNo = "0000000000000000", BirthPlace = "-", dst.');
  } else if (!ocrResults.length) {
    console.log('  ⚠ Lead.ktpUrl ada tapi tidak ada record LeadOcrResult.');
    console.log('     Submit lead mungkin belum pernah dijalankan, atau gagal sebelum OCR step.');
  } else {
    const successOcr = ocrResults.find((r) => r.status === 'SUCCESS');
    const failedOcr = ocrResults.find((r) => r.status === 'FAILED');
    if (successOcr && successOcr.nik) {
      console.log('  ✓ OCR sukses dengan NIK terbaca → seharusnya id_no real masuk ke Hyundai.');
    } else if (successOcr && !successOcr.nik) {
      console.log('  ⚠ OCR call sukses tapi field NIK tidak terbaca dari KTP.');
    } else if (failedOcr) {
      console.log('  ✗ OCR call gagal di sisi Hyundai:');
      console.log(`     errorMessage = ${failedOcr.errorMessage ?? 'unknown'}`);
    }
  }
  console.log('');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
