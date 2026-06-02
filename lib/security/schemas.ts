/**
 * Zod schemas for public-facing API inputs.
 *
 * Each schema is the single source of truth for what an endpoint accepts.
 * Keep these strict (length caps, format checks, malicious-payload rejects)
 * so the API boundary stays narrow.
 */
import { z } from 'zod';
import { HONEYPOT_FIELD } from './honeypot';
import { cleanString, looksMalicious } from './sanitize';

const MAX_NAME = 100;
const MAX_EMAIL = 254; // RFC 5321
const MAX_PHONE = 20;
const MAX_PRODUCT = 200;
const MAX_VENDOR = 200;
const MAX_NOTES = 1000;

/** Trimmed, control-char-stripped string with a length cap and anti-injection probe. */
const safeText = (max: number) =>
  z
    .string()
    .max(max, `max ${max} karakter`)
    .transform(cleanString)
    .refine((v) => !looksMalicious(v), { message: 'mengandung karakter yang tidak diizinkan' });

const optionalSafeText = (max: number) =>
  z
    .union([safeText(max), z.literal(''), z.null(), z.undefined()])
    .transform((v) => (v == null || v === '' ? null : v));

const phoneSchema = z
  .string()
  .max(MAX_PHONE)
  .transform((v) => cleanString(v))
  .refine((v) => /^[0-9+\-\s()]+$/.test(v), { message: 'format nomor telepon tidak valid' })
  .refine((v) => v.replace(/\D/g, '').length >= 8 && v.replace(/\D/g, '').length <= 15, {
    message: 'panjang nomor telepon tidak valid',
  });

const emailSchema = z
  .string()
  .max(MAX_EMAIL)
  .transform((v) => cleanString(v).toLowerCase())
  .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: 'format email tidak valid' });

/** Coerce to finite positive Float; passthrough null/undefined. */
const optionalPositiveNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  })
  .refine((v) => v == null || v >= 0, { message: 'nilai harus >= 0' });

const latitudeSchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  })
  .refine((v) => v == null || (v >= -90 && v <= 90), { message: 'latitude out of range' });

const longitudeSchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  })
  .refine((v) => v == null || (v >= -180 && v <= 180), { message: 'longitude out of range' });

const httpUrlSchema = z
  .string()
  .max(2048)
  .refine((v) => /^https?:\/\/[^\s<>"']+$/i.test(v), { message: 'URL tidak valid' });

const optionalHttpUrl = z
  .union([httpUrlSchema, z.literal(''), z.null(), z.undefined()])
  .transform((v) => (v == null || v === '' ? null : v));

export const HOME_OWNERSHIP_VALUES = ['OWN', 'FAMILY', 'RENT', 'COMPANY', 'OTHER'] as const;

/** Public lead submission (POST /api/leads). */
export const leadCreateSchema = z
  .object({
    name: safeText(MAX_NAME).refine((v) => v.length > 0, { message: 'nama wajib diisi' }),
    phone: phoneSchema,
    email: emailSchema,

    productName: optionalSafeText(MAX_PRODUCT),
    vehicleSummary: optionalSafeText(MAX_PRODUCT),

    // assetSnapshot validated separately via parseLeadAssetSnapshot.
    // Accept arbitrary JSON object or null here; deeper schema lives in lead-asset-snapshot.ts.
    assetSnapshot: z.record(z.string(), z.unknown()).nullable().optional(),

    vendorCode: optionalSafeText(MAX_VENDOR),
    vendorName: optionalSafeText(MAX_VENDOR),
    vendorCity: optionalSafeText(MAX_VENDOR),
    oriOfficeCode: optionalSafeText(MAX_VENDOR),
    oriOfficeName: optionalSafeText(MAX_VENDOR),

    otrPrice: optionalPositiveNumber,
    dpPercent: optionalPositiveNumber,
    tenor: optionalPositiveNumber,

    ktpUrl: optionalHttpUrl,
    citizenType: z.enum(['LOCAL', 'FOREIGNER']).nullable().optional().transform((v) => v ?? null),
    motherName: optionalSafeText(MAX_NAME),
    homeOwnershipStatus: z
      .union([z.enum(HOME_OWNERSHIP_VALUES), z.literal(''), z.null(), z.undefined()])
      .transform((v) => (v == null || v === '' ? null : v)),

    notes: optionalSafeText(MAX_NOTES),
    consentAccepted: z.boolean().optional().default(false),

    latitude: latitudeSchema,
    longitude: longitudeSchema,

    // Honeypot — must be empty for legit submissions.
    [HONEYPOT_FIELD]: z.string().optional(),
  })
  .strip();

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

/** Public Hyundai AddLeadAsset draft (POST /api/simulation/lead-asset). */
export const leadAssetDraftSchema = z
  .object({
    vendor: z
      .object({
        VendorCode: safeText(MAX_VENDOR),
        VendorName: safeText(MAX_VENDOR).optional(),
        OriOfficeCode: safeText(MAX_VENDOR),
        OriOfficeName: safeText(MAX_VENDOR).optional(),
        City: safeText(MAX_VENDOR).optional(),
      })
      .passthrough(),
    assetSnapshot: z.record(z.string(), z.unknown()),
    otrPrice: z.coerce.number().positive(),
    discount: z.coerce.number().nonnegative().optional().default(0),
    [HONEYPOT_FIELD]: z.string().optional(),
  })
  .strip();

export type LeadAssetDraftInput = z.infer<typeof leadAssetDraftSchema>;
