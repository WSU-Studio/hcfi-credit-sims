/**
 * Hyundai Fase 3 — Validation step (sebelum AddLeadCust).
 *
 * Per Postman v1.1 (folder "Customer Data (Fase 3) → Validation"):
 *   - POST /v1/IntegrationWebsite/ValidateCustZipCode
 *       Cek kombinasi ZipCode + City + AreaCode1 + AreaCode2 ada di master Hyundai.
 *       Failed → "Zipcode Not Registered in Database." (HTTP 404).
 *   - POST /v1/IntegrationWebsite/ValidateDuplicatePhoneAndEmail
 *       Cek email/phone tidak duplicate di lead lain (untuk CustType "CUSTOMER").
 *
 * Tujuan dipakai SEBELUM AddLeadCust adalah fail-fast: kalau zipcode/phone/email
 * invalid, kita tahu di sini dengan pesan spesifik—bukan dari error generik di
 * AddLeadCust.
 *
 * `hyundaiPost` di lib/hyundai-api-post.ts otomatis throw kalau StatusCode != "200"
 * atau HTTP non-OK, jadi caller cukup `await` tanpa cek manual.
 */

import { hyundaiPost } from '@/lib/hyundai-api-post';
import { integrationRequestBody } from '@/lib/hyundai-integration-request';

export type ZipcodeValidationInput = {
  zipCode: string;
  city: string;
  areaCode1: string;
  areaCode2: string;
};

export type PhoneEmailValidationInput = {
  leadNo: string;
  email: string;
  phoneNo: string;
  /** Di Postman default "CUSTOMER". Hyundai juga support "SPOUSE" untuk validasi pasangan. */
  custType?: 'CUSTOMER' | 'SPOUSE';
};

/**
 * Validate ZipCode + City + AreaCode kombinasi terhadap master Hyundai.
 * Throw Error dengan pesan yang user-friendly kalau gagal.
 */
export async function validateCustomerZipcode(
  input: ZipcodeValidationInput
): Promise<void> {
  try {
    await hyundaiPost('/v1/IntegrationWebsite/ValidateCustZipCode', integrationRequestBody({
      ZipCode: input.zipCode,
      City: input.city,
      AreaCode1: input.areaCode1,
      AreaCode2: input.areaCode2,
    }));
  } catch (err) {
    const original = err instanceof Error ? err.message : String(err);
    console.error('[validateCustomerLocation]', {
      zipCode: input.zipCode,
      city: input.city,
      original,
    });
    throw new Error(
      `Kode pos / kota belum valid (ZipCode=${input.zipCode}, City=${input.city}). Pastikan data KTP terbaca jelas.`
    );
  }
}

/**
 * Validate email + phone tidak duplicate di Hyundai LOS.
 * Throw Error dengan pesan jelas kalau Hyundai balas duplicate.
 */
export async function validateCustomerPhoneAndEmail(
  input: PhoneEmailValidationInput
): Promise<void> {
  const custType = input.custType ?? 'CUSTOMER';
  try {
    await hyundaiPost('/v1/IntegrationWebsite/ValidateDuplicatePhoneAndEmail', integrationRequestBody({
      LeadNo: input.leadNo,
      Email: input.email,
      PhoneNo: input.phoneNo,
      CustType: custType,
    }));
  } catch (err) {
    const original = err instanceof Error ? err.message : String(err);
    // Do not log raw email/phone (PII) — length only for ops debugging.
    console.error('[validateCustomerPhoneAndEmail]', {
      emailLen: input.email?.length ?? 0,
      phoneLen: input.phoneNo?.length ?? 0,
      custType,
      original,
    });
    throw new Error(
      'Email atau nomor telepon sudah terdaftar / belum valid. Silakan periksa kembali data kontak.'
    );
  }
}
