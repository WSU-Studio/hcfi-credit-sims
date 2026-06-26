/**
 * Hyundai LOS integration for admin lead assignment (PIC @ HO → CMO).
 *
 * Flow lengkap (per Postman v1.4) — dijalankan saat admin klik "Submit" di
 * /admin/leads (setelah isi kota, dealer, dan MOC):
 *
 *   Fase 1 — Lead Asset
 *     1. AddLeadAsset                            → return TrxNo (= LeadNo)
 *     2. GetLeadAssetSummaryInfoByLeadNo (verify)
 *
 *   Fase 2 — Financial Data (lihat lib/hyundai-lead-financial.ts)
 *     3. CalculateProductFromRule
 *     4. SimulateFinancialCalculate
 *     5. SaveFinancialData
 *     6. FinalCalculateByLeadNo
 *     7. SaveFinalCalculateResult
 *
 *   Fase 3 — Customer Data
 *     8.  GetOcrKtpData                          (OCR)
 *     9.  GetLocationDataByZipcode               (Master Data Dropdown)
 *     10. sync insurance                         (helper internal)
 *     11. ValidateCustZipCode                    (Validation, fail-fast)
 *     12. ValidateDuplicatePhoneAndEmail         (Validation, fail-fast)
 *     13. AddLeadCust                            (Save — ujung Fase 3)
 *
 * Catatan:
 *   - ForwardLeadToCMO tidak dipakai. Assignment CMO via SupplierEmpNo di
 *     AddLeadAsset.
 *   - Master Data dropdown lain (Gender / Marital / Religion / Nationality /
 *     Education / Country / Building Ownership) tidak dipanggil—kita pakai
 *     static mapping di lib/hyundai-ocr.ts. Endpoint dropdown Hyundai hanya
 *     untuk populate UI di mobile app mereka.
 *   - Endpoint Postman v1.1 yang ditandai `[x]` (Validate Zipcode and Asset
 *     Region, Recalculate Insurance Data - Change Region, Realculate By
 *     Lead No, Save Final Calculate Result Fase 3) sudah deprecated.
 */

import { prisma } from '@/lib/prisma';
import { fetchLeadKtpFromS3 } from '@/lib/lead-ktp-storage';
import {
  getOcrKtpData,
  HyundaiOcrError,
  mapGender,
  mapMarital,
  normalizeBirthDate,
  normalizeRtRw,
  type OcrKtpRead,
} from '@/lib/hyundai-ocr';
import { hyundaiPost, type HyundaiApiEnvelope } from '@/lib/hyundai-api-post';
import { FOU_API_BASE_URL } from '@/lib/hyundai-api-client';
import { hyundaiPostLogged } from '@/lib/hyundai-api-log';
import { resolveLeadAsset, type ResolvedLeadAsset } from '@/lib/hyundai-asset-resolve';
import { resolveAssetPriceAmt, verifyLeadAssetExists } from '@/lib/hyundai-asset-price';
import { bootstrapLeadFinancialAndInsurance } from '@/lib/hyundai-lead-financial';
import { integrationRequestBody } from '@/lib/hyundai-integration-request';
import { syncLeadAssetInsurance } from '@/lib/hyundai-insurance';
import { resolveDefaultOemAccessories, type ResolvedOemAccessories } from '@/lib/hyundai-oem-accessory';
import {
  resolveCustomerLocation,
  type HyundaiCustomerLocation,
} from '@/lib/hyundai-zipcode-resolve';
import {
  validateCustomerZipcode,
  validateCustomerPhoneAndEmail,
} from '@/lib/hyundai-customer-validation';
import { resolveIsPartner } from '@/lib/hyundai-partner';
import {
  buildHyundaiIdFilePayload,
  isHyundaiIdFileContentError,
} from '@/lib/hyundai-file-content';
import type { LeadAssetSnapshot } from '@/lib/lead-asset-snapshot';
import type { Vendor } from '@/app/types/credit-simulation';
import {
  mapOfficeMemberCmoToKeyValue,
  resolveCmoAssignFields,
  type HyundaiKeyValue,
  type OfficeMemberCmo,
} from '@/lib/hyundai-cmo-assign';

export type { HyundaiKeyValue, OfficeMemberCmo } from '@/lib/hyundai-cmo-assign';
export { resolveCmoAssignFields } from '@/lib/hyundai-cmo-assign';

export async function fetchOfficeMemberCmo(
  dealerCode: string,
  options?: { oriOfficeCode?: string; cmoCode?: string }
): Promise<OfficeMemberCmo[]> {
  const data = await hyundaiPost<{ ReturnObject?: OfficeMemberCmo[] }>(
    '/v1/VendorEmpX/GetOfficeMemberCmo',
    {
      DealerCode: dealerCode,
      OfficeMemberCode: options?.oriOfficeCode ?? '',
      CMOCode: options?.cmoCode ?? '',
      IsCMOActive: true,
    },
    { baseUrl: FOU_API_BASE_URL }
  );
  return data.ReturnObject ?? [];
}

/** CMO list for admin lead assignment dropdown (Postman v1.7). */
export async function fetchSalesPersonsByVendor(
  dealerCode: string,
  options?: { oriOfficeCode?: string }
): Promise<HyundaiKeyValue[]> {
  const rows = await fetchOfficeMemberCmo(dealerCode, {
    oriOfficeCode: options?.oriOfficeCode,
  });
  return mapOfficeMemberCmoToKeyValue(rows, options?.oriOfficeCode);
}

const HOME_OWNERSHIP_MAP: Record<string, string> = {
  OWN: 'OWNED',
  OWNED: 'OWNED',
  FAMILY: 'FAMILY',
  RENT: 'RENT',
  COMPANY: 'COMPANY',
  OTHER: 'OTHER',
};

export async function fetchVendorsForAssignment(): Promise<Vendor[]> {
  const data = await hyundaiPost<{ ReturnObject?: Vendor[] }>(
    '/Foundation/v1/VendorObX/GetListVendorAndVendorCity',
    { hasAvailableAssetOnly: true, hasCmoAssignedOnly: true }
  );
  return data.ReturnObject ?? [];
}

export type LeadRecordForHyundai = {
  id: string;
  name: string;
  phone: string;
  email: string;
  productName: string | null;
  vehicleSummary: string | null;
  assetSnapshot?: LeadAssetSnapshot | null;
  vendorCode?: string | null;
  otrPrice: number | null;
  dpPercent: number | null;
  tenor: number | null;
  motherName: string | null;
  homeOwnershipStatus: string | null;
  citizenType: string | null;
  notes: string | null;
  ktpUrl: string | null;
  /**
   * Nanti: true untuk lead dari perusahaan partner Hyundai (diskon khusus).
   * Saat ini belum ada sumber di DB — default false via resolveIsPartner().
   */
  isPartner?: boolean | null;
};

function buildAddLeadAssetBody(
  vendor: Vendor,
  cmoEmpNo: string,
  asset: ResolvedLeadAsset,
  oem: ResolvedOemAccessories,
  assetPriceAmt: number
): Record<string, unknown> {
  return {
    SerialNo1: null,
    SerialNo2: null,
    AssetLv1Code: 'HYUNDAI',
    AssetLv2Code: asset.modelCode,
    AssetLv2Name: asset.modelName.slice(0, 100),
    AssetLv3Code: asset.fscCode,
    AssetLv3Name: asset.trimName || asset.modelName,
    ManufacturingYear: String(asset.manufacturingYear),
    AssetPriceAmt: assetPriceAmt,
    OriOfficeName: vendor.OriOfficeName,
    OriOfficeCode: vendor.OriOfficeCode,
    OriSupplierName: vendor.VendorName,
    OriSupplierCode: vendor.VendorCode,
    SupplierEmpNo: cmoEmpNo,
    MrAssetUsageCode: 'NON_COMM',
    MrAssetInteriorCode: asset.interiorColorCode,
    MrAssetInteriorName: asset.interiorColorName,
    MrAssetExteriorCode: asset.exteriorColorCode,
    MrAssetExteriorName: asset.exteriorColorName,
    AssetDiscAmt: 0,
    AdditionalItemPriceAmt: 0,
    AdditionalItemName: '',
    ListMrAssetOEMAccessoryCode: oem.codes,
    OEMWarrantyCode: '',
    OEMWarrantyName: '',
    OEMWarrantyPriceAmt: 0,
    listAssetOEMAccessory: oem.list,
  };
}

function buildAddLeadCustBody(
  lead: LeadRecordForHyundai,
  leadNo: string,
  ocr: OcrKtpRead | null,
  location: HyundaiCustomerLocation,
  cmo: { CMOCode: string; CMOName: string },
  ktpFile?: { fileName: string; base64: string; buffer: Buffer }
): Record<string, unknown> {
  const nationality =
    ocr?.mrNationalityCode ||
    (lead.citizenType === 'FOREIGNER' ? 'FOREIGNER' : 'LOCAL');
  const houseCode = lead.homeOwnershipStatus
    ? HOME_OWNERSHIP_MAP[lead.homeOwnershipStatus.toUpperCase()] ?? 'OTHER'
    : 'OTHER';

  const body: Record<string, unknown> = integrationRequestBody({
    LeadNo: leadNo,
    CMOCode: cmo.CMOCode,
    CMOName: cmo.CMOName,
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
    AreaCode4: normalizeRtRw(ocr?.Rt),
    AreaCode3: normalizeRtRw(ocr?.Rw),
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
  }) as Record<string, unknown>;

  if (ktpFile?.buffer?.length) {
    body.IdFile = buildHyundaiIdFilePayload({
      buffer: ktpFile.buffer,
      fileName: ktpFile.fileName,
    });
  }

  return body;
}

async function persistOcrResult(params: {
  leadId: string;
  hyundaiLeadNo: string;
  ktpFileName?: string;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  rawResponse?: unknown;
  read?: OcrKtpRead | null;
  addLeadCustPayload?: Record<string, unknown>;
}) {
  const r = params.read;
  return prisma.leadOcrResult.create({
    data: {
      leadId: params.leadId,
      hyundaiLeadNo: params.hyundaiLeadNo,
      ktpFileName: params.ktpFileName,
      status: params.status,
      errorMessage: params.errorMessage,
      rawResponse: params.rawResponse as object | undefined,
      nik: r?.nik ?? null,
      nama: r?.nama ?? null,
      tempatLahir: r?.tempatLahir ?? null,
      tanggalLahir: r?.tanggalLahir ?? null,
      jenisKelamin: r?.jenisKelamin ?? null,
      alamat: r?.alamat ?? null,
      kotaKabupaten: r?.kotaKabupaten ?? null,
      kecamatan: r?.kecamatan ?? null,
      kelurahanDesa: r?.kelurahanDesa ?? null,
      zipCode: r?.Zipcode ?? null,
      agama: r?.agama ?? null,
      statusPerkawinan: r?.statusPerkawinan ?? null,
      mrNationalityCode: r?.mrNationalityCode ?? null,
      addLeadCustPayload: params.addLeadCustPayload as object | undefined,
    },
  });
}

export async function submitLeadToHyundai(params: {
  lead: LeadRecordForHyundai;
  vendor: Vendor;
  cmoEmpNo: string;
  cmoName: string;
  /** Override flag partner (opsional); default dari `lead.isPartner`. */
  isPartner?: boolean;
}): Promise<{ leadNo: string }> {
  const isPartner = resolveIsPartner({
    isPartner: params.isPartner ?? params.lead.isPartner,
  });
  const resolvedAsset = await resolveLeadAsset({
    dealerCode: params.vendor.VendorCode,
    vehicleSummary: params.lead.vehicleSummary,
    snapshot: params.lead.assetSnapshot,
    simulationVendorCode: params.lead.vendorCode,
  });

  if (!params.lead.otrPrice || params.lead.otrPrice <= 0) {
    throw new Error('Lead tidak memiliki harga OTR. Data simulasi tidak lengkap.');
  }

  // Validasi & konversi KTP lebih awal — gagal cepat sebelum chain finansial (~15s).
  let ktpFile: { fileName: string; base64: string; buffer: Buffer } | undefined;
  if (params.lead.ktpUrl) {
    try {
      ktpFile = await fetchLeadKtpFromS3(params.lead.ktpUrl);
    } catch (ktpErr) {
      const detail = ktpErr instanceof Error ? ktpErr.message : String(ktpErr);
      throw new Error(
        `KTP lead tidak bisa diproses (${detail}). Minta customer upload ulang foto KTP (JPEG/PNG, jelas, tidak blur).`
      );
    }
  }

  const oemAccessories = await resolveDefaultOemAccessories(resolvedAsset.modelCode);

  const assetPriceAmt = await resolveAssetPriceAmt({
    asset: resolvedAsset,
    dealerCode: params.vendor.VendorCode,
    oem: oemAccessories,
    fallbackOtr: params.lead.otrPrice,
  });

  const assetRes = await hyundaiPost<HyundaiApiEnvelope>(
    '/v1/IntegrationWebsite/AddLeadAsset',
    buildAddLeadAssetBody(
      params.vendor,
      params.cmoEmpNo,
      resolvedAsset,
      oemAccessories,
      assetPriceAmt
    )
  );

  const leadNo = assetRes.TrxNo;
  if (!leadNo) {
    throw new Error('AddLeadAsset did not return LeadNo (TrxNo)');
  }

  await verifyLeadAssetExists(leadNo);

  await bootstrapLeadFinancialAndInsurance({
    leadNo,
    otrPrice: params.lead.otrPrice ?? 0,
    dpPercent: params.lead.dpPercent ?? 10,
    tenor: params.lead.tenor ?? 36,
    productName: params.lead.productName,
    leadId: params.lead.id,
    isPartner,
  });

  let ocrRead: OcrKtpRead | null = null;

  if (ktpFile) {
    try {
      const ocrRes = await getOcrKtpData({
        trxNo: leadNo,
        fileName: ktpFile.fileName,
        byteBase64: ktpFile.base64,
      });
      ocrRead = ocrRes.Read ?? null;

      await persistOcrResult({
        leadId: params.lead.id,
        hyundaiLeadNo: leadNo,
        ktpFileName: ktpFile.fileName,
        status: 'SUCCESS',
        rawResponse: ocrRes,
        read: ocrRead,
      });
    } catch (ocrErr) {
      const msg = ocrErr instanceof Error ? ocrErr.message : 'OCR failed';
      const rawResponse =
        ocrErr instanceof HyundaiOcrError ? ocrErr.rawResponse : undefined;
      await persistOcrResult({
        leadId: params.lead.id,
        hyundaiLeadNo: leadNo,
        ktpFileName: ktpFile?.fileName,
        status: 'FAILED',
        errorMessage: msg,
        rawResponse,
      });
    }
  }

  const customerLocation = await resolveCustomerLocation({
    ocr: ocrRead,
    vendorZipCode: params.vendor.ZipCode,
  });

  const idNo = ocrRead?.nik?.replace(/\D/g, '').slice(0, 16) || '0000000000000000';
  await syncLeadAssetInsurance({
    leadNo,
    location: customerLocation,
    idNo,
    vendorCity: params.vendor.City,
  });

  // Fase 3 Validation — fail-fast sebelum AddLeadCust (per Postman v1.1).
  // ZipCode sudah resolved via GetLocationDataByZipcode, tapi Hyundai tetap
  // minta ValidateCustZipCode untuk konfirmasi kombinasi master + permission.
  await validateCustomerZipcode({
    zipCode: customerLocation.zipCode,
    city: customerLocation.city,
    areaCode1: customerLocation.areaCode1,
    areaCode2: customerLocation.areaCode2,
  });

  const sanitizedPhoneForValidation = params.lead.phone.replace(/\D/g, '').slice(0, 15);
  await validateCustomerPhoneAndEmail({
    leadNo,
    email: params.lead.email,
    phoneNo: sanitizedPhoneForValidation,
    custType: 'CUSTOMER',
  });

  const addLeadCustPayload = buildAddLeadCustBody(
    params.lead,
    leadNo,
    ocrRead,
    customerLocation,
    resolveCmoAssignFields(params.cmoEmpNo, params.cmoName),
    ktpFile
  );

  // Endpoint terakhir & paling kritikal — full request/response dilog ke
  // HyundaiApiCallLog untuk audit + troubleshooting dengan tim Hyundai.
  try {
    await hyundaiPostLogged('/v1/IntegrationWebsite/AddLeadCust', addLeadCustPayload, {
      leadId: params.lead.id,
      hyundaiLeadNo: leadNo,
      endpoint: 'AddLeadCust',
    });
  } catch (addCustErr) {
    const msg = addCustErr instanceof Error ? addCustErr.message : String(addCustErr);
    if (isHyundaiIdFileContentError(msg) && addLeadCustPayload.IdFile) {
      console.warn(
        '[submitLeadToHyundai] AddLeadCust menolak IdFile.Content, retry tanpa lampiran KTP:',
        msg
      );
      const { IdFile: _omitted, ...withoutIdFile } = addLeadCustPayload;
      await hyundaiPostLogged('/v1/IntegrationWebsite/AddLeadCust', withoutIdFile, {
        leadId: params.lead.id,
        hyundaiLeadNo: leadNo,
        endpoint: 'AddLeadCust',
      });
    } else {
      throw addCustErr;
    }
  }

  // Persist payload yang dikirim ke `AddLeadCust` untuk audit & troubleshooting.
  // Field `IdFile.Content` (base64 KTP) bisa sangat besar—ganti dengan marker
  // supaya record DB tidak membengkak; FileName tetap disimpan untuk traceability.
  const persistablePayload = {
    ...addLeadCustPayload,
    IdFile:
      addLeadCustPayload.IdFile && typeof addLeadCustPayload.IdFile === 'object'
        ? {
            FileName: (addLeadCustPayload.IdFile as { FileName?: string }).FileName,
            Content: '<base64 omitted>',
          }
        : undefined,
  };

  // Update untuk SEMUA status (SUCCESS / FAILED) — sebelumnya hanya SUCCESS.
  // Kalau OCR sukses, akan ada 1 row LeadOcrResult di-update.
  // Kalau OCR gagal tapi KTP ter-upload, juga ada 1 row FAILED yang di-update.
  // Kalau lead tidak punya KTP, tidak ada row OCR sama sekali → buat satu sebagai
  // marker NO_KTP supaya payload tetap ter-trace.
  const ocrUpdate = await prisma.leadOcrResult.updateMany({
    where: {
      leadId: params.lead.id,
      hyundaiLeadNo: leadNo,
    },
    data: { addLeadCustPayload: persistablePayload as object },
  });

  if (ocrUpdate.count === 0) {
    await persistOcrResult({
      leadId: params.lead.id,
      hyundaiLeadNo: leadNo,
      status: 'FAILED',
      errorMessage: 'KTP tidak di-upload — payload AddLeadCust pakai placeholder',
      addLeadCustPayload: persistablePayload,
    });
  }

  return { leadNo };
}
