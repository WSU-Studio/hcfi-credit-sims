/**
 * Hyundai LOS integration for admin lead assignment (PIC @ HO → CMO).
 * Flow: AddLeadAsset → OCR KTP → AddLeadCust → ForwardLeadToCMO
 */

import { prisma } from '@/lib/prisma';
import { fetchLeadKtpFromS3 } from '@/lib/lead-ktp-storage';
import {
  getOcrKtpData,
  mapGender,
  mapMarital,
  normalizeBirthDate,
  type OcrKtpRead,
} from '@/lib/hyundai-ocr';
import { getHyundaiRequestHeaders, API_BASE_URL } from '@/lib/hyundai-api-client';
import type { Vendor } from '@/app/types/credit-simulation';

export type HyundaiKeyValue = { Key: string; Value: string };

type HyundaiApiEnvelope = {
  TrxNo?: string;
  HeaderObj?: { StatusCode?: string; Message?: string };
  StatusCode?: string;
  Message?: string;
};

const HOME_OWNERSHIP_MAP: Record<string, string> = {
  OWN: 'OWNED',
  OWNED: 'OWNED',
  FAMILY: 'FAMILY',
  RENT: 'RENT',
  COMPANY: 'COMPANY',
  OTHER: 'OTHER',
};

function hyundaiNow(): string {
  return new Date().toISOString();
}

async function hyundaiPost<T = HyundaiApiEnvelope>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const headers = await getHyundaiRequestHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: T & { Message?: string };
  try {
    data = text ? JSON.parse(text) : ({} as T);
  } catch {
    throw new Error('Invalid response from Hyundai API');
  }
  if (!res.ok) {
    const msg =
      (data as { Message?: string }).Message ||
      text.slice(0, 300) ||
      `Hyundai API error (${res.status})`;
    throw new Error(msg);
  }
  const status = (data as HyundaiApiEnvelope).StatusCode ?? (data as HyundaiApiEnvelope).HeaderObj?.StatusCode;
  if (status && status !== '200') {
    throw new Error((data as HyundaiApiEnvelope).Message || 'Hyundai API returned non-success status');
  }
  return data;
}

export async function fetchVendorsForAssignment(): Promise<Vendor[]> {
  const data = await hyundaiPost<{ ReturnObject?: Vendor[] }>(
    '/Foundation/v1/VendorObX/GetListVendorAndVendorCity',
    { hasAvailableAssetOnly: true, hasCmoAssignedOnly: true }
  );
  return data.ReturnObject ?? [];
}

export async function fetchSalesPersonsByVendor(vendorCode: string): Promise<HyundaiKeyValue[]> {
  const data = await hyundaiPost<{ ReturnObject?: HyundaiKeyValue[] }>(
    '/v1/VendorEmp/GetListKeyValueActiveSalesPersonByVendorCode',
    { Code: vendorCode }
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
  otrPrice: number | null;
  motherName: string | null;
  homeOwnershipStatus: string | null;
  citizenType: string | null;
  notes: string | null;
  ktpUrl: string | null;
};

function parseVehicleSummary(summary: string | null) {
  if (!summary) return { year: new Date().getFullYear(), modelName: 'HYUNDAI', trimName: '' };
  const yearMatch = summary.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
  const parts = summary.split('·').map((p) => p.trim());
  const modelPart = parts[0]?.replace(/^\d{4}\s*/, '').trim() || summary;
  const trimPart = parts[1] || '';
  return { year, modelName: modelPart || 'HYUNDAI', trimName: trimPart };
}

function buildAddLeadAssetBody(
  lead: LeadRecordForHyundai,
  vendor: Vendor,
  cmoEmpNo: string
): Record<string, unknown> {
  const { year, modelName, trimName } = parseVehicleSummary(lead.vehicleSummary);
  const price = lead.otrPrice ?? 0;

  return {
    SerialNo1: null,
    SerialNo2: null,
    AssetLv1Code: 'HYUNDAI',
    AssetLv2Code: '4U',
    AssetLv2Name: modelName.slice(0, 100),
    AssetLv3Code: '',
    AssetLv3Name: trimName || modelName,
    ManufacturingYear: String(year),
    AssetPriceAmt: price,
    OriOfficeName: vendor.OriOfficeName,
    OriOfficeCode: vendor.OriOfficeCode,
    OriSupplierName: vendor.VendorName,
    OriSupplierCode: vendor.VendorCode,
    SupplierEmpNo: cmoEmpNo,
    MrAssetUsageCode: 'NON_COMM',
    MrAssetInteriorCode: '',
    MrAssetInteriorName: '',
    MrAssetExteriorCode: '',
    MrAssetExteriorName: '',
    AssetDiscAmt: 0,
    AdditionalItemPriceAmt: 0,
    AdditionalItemName: '',
    ListMrAssetOEMAccessoryCode: [],
    OEMWarrantyCode: '',
    OEMWarrantyName: '',
    OEMWarrantyPriceAmt: 0,
    listAssetOEMAccessory: [],
  };
}

function buildAddLeadCustBody(
  lead: LeadRecordForHyundai,
  leadNo: string,
  ocr: OcrKtpRead | null,
  ktpFile?: { fileName: string; base64: string }
): Record<string, unknown> {
  const nationality =
    ocr?.mrNationalityCode ||
    (lead.citizenType === 'FOREIGNER' ? 'FOREIGNER' : 'LOCAL');
  const houseCode = lead.homeOwnershipStatus
    ? HOME_OWNERSHIP_MAP[lead.homeOwnershipStatus.toUpperCase()] ?? 'OTHER'
    : 'OTHER';

  const body: Record<string, unknown> = {
    requestDateTime: hyundaiNow(),
    rowVersion: '',
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
    ZipCode: ocr?.Zipcode || '00000',
    AreaCode2: ocr?.kelurahanDesa || '-',
    AreaCode1: ocr?.kecamatan || '-',
    City: ocr?.kotaKabupaten || '-',
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
  };

  if (ktpFile?.base64) {
    body.IdFile = {
      FileName: ktpFile.fileName,
      Content: ktpFile.base64,
    };
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
}): Promise<{ leadNo: string }> {
  const assetRes = await hyundaiPost<HyundaiApiEnvelope>(
    '/v1/IntegrationWebsite/AddLeadAsset',
    buildAddLeadAssetBody(params.lead, params.vendor, params.cmoEmpNo)
  );

  const leadNo = assetRes.TrxNo;
  if (!leadNo) {
    throw new Error('AddLeadAsset did not return LeadNo (TrxNo)');
  }

  let ocrRead: OcrKtpRead | null = null;
  let ktpFile: { fileName: string; base64: string } | undefined;

  if (params.lead.ktpUrl) {
    try {
      ktpFile = await fetchLeadKtpFromS3(params.lead.ktpUrl);
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
      await persistOcrResult({
        leadId: params.lead.id,
        hyundaiLeadNo: leadNo,
        ktpFileName: ktpFile?.fileName,
        status: 'FAILED',
        errorMessage: msg,
      });
      // Continue with form-only data if OCR fails
    }
  }

  const addLeadCustPayload = buildAddLeadCustBody(
    params.lead,
    leadNo,
    ocrRead,
    ktpFile
  );

  await hyundaiPost('/v1/IntegrationWebsite/AddLeadCust', addLeadCustPayload);

  if (ocrRead) {
    await prisma.leadOcrResult.updateMany({
      where: {
        leadId: params.lead.id,
        hyundaiLeadNo: leadNo,
        status: 'SUCCESS',
      },
      data: { addLeadCustPayload: addLeadCustPayload as object },
    });
  }

  await hyundaiPost('/v1/IntegrationWebsite/ForwardLeadToCMO', {
    requestDateTime: hyundaiNow(),
    rowVersion: '',
    LeadNo: leadNo,
    CustName: (ocrRead?.nama || params.lead.name).trim(),
    MobilePhnNo: params.lead.phone.replace(/\D/g, '').slice(0, 15),
  });

  return { leadNo };
}
