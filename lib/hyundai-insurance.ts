import { hyundaiPost } from '@/lib/hyundai-api-post';
import type { HyundaiCustomerLocation } from '@/lib/hyundai-zipcode-resolve';

async function tryHyundaiPost(
  path: string,
  body: Record<string, unknown>
): Promise<boolean> {
  try {
    await hyundaiPost(path, body);
    return true;
  } catch {
    return false;
  }
}

/** When customer zip region ≠ asset region (Postman Fase 3 validation). */
export async function syncLeadAssetInsurance(params: {
  leadNo: string;
  location: HyundaiCustomerLocation;
  idNo: string;
  vendorCity?: string | null;
}): Promise<void> {
  const zipRegionOk = await tryHyundaiPost(
    '/v1/IntegrationWebsite/ValidateZipCodeRegion',
    {
      ZipCode: params.location.zipCode,
      City: params.location.city,
      AreaCode1: params.location.areaCode1,
      AreaCode2: params.location.areaCode2,
      LeadNo: params.leadNo,
      IdNo: params.idNo,
      IsFamily: false,
      IsCustomer: true,
      IsGuarantor: false,
      MrCustRelationshipCode: 'Customer',
    }
  );

  if (zipRegionOk) return;

  const cities = [params.location.city, params.vendorCity].filter(
    (c, i, arr): c is string => !!c && arr.indexOf(c) === i
  );

  for (const city of cities) {
    const ok = await tryHyundaiPost(
      '/v1/Insurance/RecalculateInsuranceDataChangeRegion',
      { LeadNo: params.leadNo, City: city }
    );
    if (ok) {
      await tryHyundaiPost('/v1/LeadFinData/RecalculateByLeadNo', {
        LeadNo: params.leadNo,
      });
      return;
    }
  }
}
