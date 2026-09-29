# OpenMemory Guide

Living index for **hcfi-credit-sims** (Hyundai Capital Finance Indonesia — credit simulation + CMS).

## Overview

Next.js App Router site with public credit simulation (Hyundai LOS), CMS back-office, and dealer portal. Auth is NextAuth credentials + Postgres lockout. Phase 2 Poin 4 adds email OTP for dealer admin and salesman after password check.

## Architecture

- Public site: `app/[locale]/(site)` — banners, products, credit simulation wizard
- CMS: `app/(back-office)/admin` — RBAC menus, content, leads
- Dealer portal: `app/(dealer-portal)/dealer` — promotions, quotation, leads
- Hyundai API: `lib/hyundai-api-client.ts`, `lib/hyundai-lead-integration.ts`
- Auth: `lib/nextauth.ts` (JWT session). Dealer/salesman cannot skip OTP.
- Salesman fee override (Phase 2 Poin 2): quotation `/dealer/quotation` stepper admin fee 500rb. Bounds come from the **selected tenor row** (`CalculateProductFromRule`), not the Default product card. Confins fee `AdminFeeBhv` (Edrizal + Hery 22 Sep 2026): `MIN` ≥ / `MAX` ≤ / `DEF` prefill editable / `LOCK_ALL` lock amount+capitalize / `LOCK_AMT` lock amount / `LOCK_CPTLZ` amount editable **but not below the rule amount** (Hery poin 4). Plain `LOCK` still treated as amount-lock (DP%/EffRate enum). Capitalize is `AdminFeeCptlz` true/false — **no checkbox on the web** (Hery poin 6); flag is stored on `Lead.adminFeeBhvOverride` + `adminFeeCptlzOverride` and sent on Hyundai/Mobile Loan submit with `AdminFeeAmt` (Hery poin 7). Amount-lock is not snapped to 500rb. `pickAdminFeeSource(tenor, card)` is tenor-first (`primary ?? secondary`). Changing tenor reseeds Admin Fee from that tenor's last clean Confins snapshot (`snapshotTenorAdminFees` / `restoreTenorAdminFees`) on **public and dealer** (Amy 25 Sep 2026 poin 21: public `selectTenorRow` used to return before reseed, so Lihat Ringkasan kept the first tenor's Admin Fee). Do **not** send a locked Default-card `AdminFeeAmt` into `CalculateProductFromRule` (that endpoint returns all tenors; GIIAS Low DP `LOCK_ALL` 0 on tenor 36 flattened tenor 12's 3jt). Locked amount is only sent on single-tenor FinalCalculate (`includeLocked`). Multi-tenor simulate splits flags: `provisionTouched` sends only `provisionFee`; `adminFeeTouched` sends Admin Fee. Amy 25 Sep 2026: raising provision to 9% used to stamp the current Admin Fee (or Confins Default-card 3jt) onto every tenor, so GIIAS Low Interest tenor 36 `LOCK_CPTLZ` 5jt stayed 3jt after clicking other tenors. Public View Summary does not pass the stepper `adminFeeAmt` override — it uses the tenor row.
- **ProvisionFeeBhv** (Richwill / Chaca 29 Sep 2026): same Confins enum as Admin Fee. Do **not** hardcode `ProvisionFeeBhv: DEF` in `buildHyundaiFeeRequestFields`. When rule is `LOCK_AMT` / `LOCK_ALL` / `LOCK`, omit provision override entirely on CalculateProductFromRule, SimulateFinancialCalculate, and SaveFinancialData (`stripLockedProvisionOverride`); quotation stepper is locked (`resolveProvisionFeeRule` + `provisionLocked`). Only persist `provisionFeeOverride` when salesman actually edited an unlocked provision. `bootstrapLeadFinancialAndInsurance` re-strips using simulate-row Bhv so old leads that stored a % still cannot overwrite `LOCK_AMT` on SaveFinancialData.
- View Summary **Biaya Dibayar Customer** (`FeePaidAmt`) is a **total**: Admin Fee + Provisi + Fiducia. `CalculateProductFromRule` often omits/zeros `FiduciaFeeAmt` even though FinalCalculate already baked ~Rp 1.000.000 into `FeePaidAmt`. `resolveCustomerFeeBreakdown` uses explicit Fiducia if > 0, otherwise remainder `FeePaid − admin − provisi`. Modal order: Admin fee → Provisi → Fiducia → Biaya Dibayar Customer. Pass wizard `adminFeeAmt` into `withCustomerFeeBreakdown` so remainder is not the whole total.
- Ringkasan after submit (Amy 23 Sep 2026, KIA+HCFI): ContactModal snapshot falls back to `buildSummaryFromProductRow` when Lihat Ringkasan was not run. That path used to zero `assetInsPaidAmt` and omit balloon from Total Payment even though `TdpAmt` already included insurance. Admin **Ringkasan** prefers the stored snapshot (no Confins re-hit). `lib/lead-summary-amounts.ts` recovers insurance as TDP − DP − ADDM inst − FeePaid, and adds balloon when Total Payment equals TDP + remaining inst. `parseLeadSummarySnapshot` hydrates existing DB snapshots on read. Amy 25 Sep 2026 poin 19: MLoan Financial Data **Asset Insurance Paid** stayed Rp 0 after submit while quotation TDP already included insurance (e.g. Rp 17.667.136). `SimulateFinancialCalculate` omits `AssetInsPaidAmt`; SaveFinancialData used to spread that row as-is. `withAssetInsPaidAmtIfMissing` now fills the split field on SaveFinancialData + SaveFinalCalculateResult **without changing TdpAmt**.
- Public website AddLeadAsset must not send `SupplierEmpNo`. Channel `WEBSITE_CUST` already ignored dealer session, but emp was still copied when the tester’s dealer cookie matched the chosen vendor (Amy: Emp badge on web-cust leads). Gate emp + session lookup on `source === DEALER_SALES`. `/api/leads` stores `salesEmpNo` only for dealer quotation. Admin LeadsTable shows the Emp chip only for `DEALER_SALES`.
- Promo banner live landing (Phase 2 Poin 3): one PreSimulation record, two public URLs. Snapshot `/pre-sim/[slug]` stays QR/read-only. Live `/credit-simulation?promo=[slug]` hydrates the public wizard to ResultStep (Jakarta dealer, new AddLeadAsset, editable, submittable). Banner CMS picks live vs snapshot vs custom CTA. Do not reuse `simulationLeadNo` from the template.
- Salesman PriceStep discount is **two fields**: read-only **Diskon Promo Dealer** (Sales Promotion lookup / `accumulatePriceDiscounts`) plus editable **Diskon tambahan**. Get Quotation `AssetDiscAmt` is the **sum**. Do not prefill the extra input with the promo amount. `SimulationWizard` stores `discount` (total) and `additionalDiscount` (extra) so back-navigation does not double-count. **Public** `/credit-simulation` still looks up `GET /api/simulation/dealer-promotions/lookup?vendorCode=` from DealerStep `VendorCode` and still sends the **sum** as `AssetDiscAmt` / Lihat Ringkasan. Do **not** show the Diskon Promo Dealer column on public (Hery 23 Sep 2026 poin 15) — `showDealerPromoColumn` is `allowDiscountOverride` only (`/dealer/quotation`). Public PriceStep keeps a single extra-discount field; net OTR on Continue still subtracts dealer promo + extra. `ResultStep` does not re-lookup; it consumes the summed `discount`.
- Production discount unlock (Harry 12 Sep 2026) is `hotfix/salesman-discount-input` from `main` (`allowDiscountOverride` on `PriceStep` + `SimulationWizard` only). Do not cherry-pick the `dev` commit `7b80730` onto `main`. After merging the hotfix to `main`, merge it back into `dev` (keep `dev`’s `initialDiscount` / promo-landing bits). Later `dev` → `main` then shares that hotfix ancestor instead of duplicating the hunk.
- First-party visitor analytics (Phase 2 Poin 5): in-app tracker under `lib/first-party-tracker/` (not a standalone product). Ingest `POST /api/t/e`. Admin `/admin/analytics` (menu `ANALYTICS`). GA/GTM stays optional marketing, not CMS source of truth. Retention purge is a 90-day follow-up (not in this slice).

## User Defined Namespaces

- frontend
- backend
- database

## Components

- `OtpChallengeForm` (`app/components/auth/OtpChallengeForm.tsx`) — reusable OTP step for CMS and dealer login
- `usePortalLogin` (`app/hooks/usePortalLogin.ts`) — password → `/api/otp/request` → optional OTP → `signIn`
- SMTP mailer (`lib/email.ts`) — Office 365 SMTP AUTH, same env as workxpace. Resolves A record (IPv4) then connects to that IP with TLS `servername` = original host. TQA Node Happy Eyeballs otherwise picks AAAA and fails `ENETUNREACH`. Deploy env also sets `NODE_OPTIONS=--dns-result-order=ipv4first`.
- Login OTP (`lib/login-otp.ts`, `lib/auth-otp.ts`) — issue/resend/consume hashed 6-digit codes
- `LoginOtpChallenge` Prisma model (`login_otp_challenges`)
- `FeeStepper` + `CustomerPaidFees` — stepper fee quotation salesman
- `lib/lead-summary-snapshot.ts` — parse/build Lead.summarySnapshot; `withCustomerFeeBreakdown` hydrates insurance + balloon via `lib/lead-summary-amounts.ts`
- `lib/lead-summary-amounts.ts` — recover AssetInsPaidAmt as TDP remainder; repair TotalPaymentAmt to include balloon; `withAssetInsPaidAmtIfMissing` fills Confins `AssetInsPaidAmt` on SaveFinancialData / SaveFinalCalculateResult without changing TdpAmt
- `lib/salesman-fee.ts` — clamp, provision % vs amount, Hyundai fee request fields
- `PromoLandingWizard` + `usePromoLanding` — bootstrap live step-5 sim from published pre-sim slug
- `BannerCtaFields` — banner CTA: live promo / snapshot QR / custom URL
- `lib/promo-simulation.ts` — Jakarta dealer picker, seed from PreSimulation row, live vs snapshot hrefs
- First-party tracker (`lib/first-party-tracker/`) — client `track()` via sendBeacon, Zod ingest schema, admin summary queries
- `AnalyticsEvent` (`analytics_events`) — `page_view` | `product_click` | `sim_start` | `sim_step` | `sim_submit`; anonymous `visitorId` cookie `hcfi_fp_vid` (not Lead id)
- `Lead.hyundaiGoLiveAt` — first time monitoring shows Contract Activation completed
- Admin Visitor Analytics (`app/(back-office)/admin/analytics/page.tsx`) — traffic, product clicks, funnel, three conversion ratios. Default date range is last 30 inclusive days (`today` and `today - 29`); not persisted in the URL so a full refresh resets it. **Terapkan** always refetches even if Dari/Sampai did not change (repeat click is a refresh; numbers stay the same if no new events).
- Dealer sales promotions (`DealerPromotionForm` / `lib/dealer-promotion.ts`) — **one promo per vendor + model + manufacturing year + trim (`fscCode`)**. Form reuses Hyundai year/variant APIs via `YearTrimFields` + `useVehicleYearAndTrim` (same sequence as quotation SpecificationStep). Period is **inclusive calendar days in Asia/Jakarta**. Lookup `pickDealerPromotion`: exact year+trim first, else legacy model-wide (`manufYear` 0 + empty `fscCode`). Shared query `lib/dealer-promotion-lookup.ts`. PriceStep passes `selectedDealer.VendorCode` + `specs.manufacturingYear` + `specs.fscCode`. Percent discount still uses quotation OTR (trim price). Demo seeder rows include year + `SEED-Txx` trim. `DealerPromotionsTable` shows year · trim; search includes those. Do not show Hyundai `assetCode` in the table. After adding those Prisma columns, run `prisma generate` and **restart** `next dev` — the client is cached on `globalThis`, so a 500 `Unknown argument manufYear` otherwise renders as an empty promo list. Nominal diskon (Harry 25 Sep 2026) is any whole rupiah (`DISCOUNT_IDR_STEP = 1`); do not use HTML `step=1000000`. Task history (Kharisma 25 Sep 2026): `DealerPromotionHistoryTable` at the bottom of New/Edit form (always renders table chrome). Each create/update/delete writes a full snapshot into `AuditLog.metadata` via `lib/dealer-promotion-history.ts`. That helper must **not** import `lib/security/audit-log.ts` (Prisma / `next/server` — client bundle would fail). Action codes are duplicated as `DEALER_PROMOTION_HISTORY_ACTIONS`. Edit stores **before and after**; table expands them as Data lama / Data baru. GET `/api/dealer/promotions/[id]/history`. After create, redirect to edit; after edit, stay on the form. No new Prisma model. `next.config.js` immutable `Cache-Control` on `/_next/static` is **production only** — in `next dev` webpack reuses chunk names so a year-long immutable cache keeps stale dealer form JS (table missing until hard refresh).

## Patterns

- API inputs: Zod schemas under `lib/security/*-schemas.ts`
- Rate limits: in-memory `lib/ratelimit.ts` + middleware per-IP on login/OTP
- Dealer vs CMS: `USER_TYPES` in `lib/user-types.ts`; OTP required only for `DEALER_ADMIN` and `SALESMAN`
- Email send is best-effort (`sendEmail` returns boolean). OTP issue fails closed if SMTP send fails in production. Local without SMTP logs the code to the server console.
- Isolated production slice: branch from `main`, re-apply the small change on `main`’s files, merge to `main`, then merge that hotfix into `dev` (resolve conflicts by keeping `dev` when it already has the fuller feature). Do not cherry-pick a `dev` commit whose parent is far ahead of `main`.
- Pre-sim dual links: snapshot `/pre-sim/[slug]` vs live `/credit-simulation?promo=[slug]` — never mix submit onto the QR page
- First-party analytics: public site only (ignore `/admin`, `/dealer`, `/auth`); DNT/bots dropped; no name/email/phone in events
- CMS files: widgets store URLs, not blobs. Images and PDFs go through `/api/admin/media/upload` + `Media` table. `MediaPicker` `kind="image"` (default, single) or `kind="document"` (`multiple` for the download widget). Do not add a second widget-only upload path. Download widget list follows CTA `buttons[]`: `createEmptyDownloadFile` + `normalizeDownloadFiles` + `mergeSelectedDownloadMedia` in `lib/layout-builder-utils.ts`. Empty `files: []` must not fall back to leftover single-file fields. Public download cards are Server Components. Do not add `'use client'` to `WidgetRenderer` or `DownloadWidget` — webpack Flight from async `page.tsx` then crashes with `Lazy element type must resolve to a class or function` and refetch-loops. Preview is a new tab, not EmbedPDF. Same trap as `FirstPartyPageview` imported from async `SiteLayout`. CSP still allows `'wasm-unsafe-eval'` for a future isolated viewer.

## Auth OTP flow

1. `USE_OTP=true` enables dealer/salesman email OTP. Missing, empty, or any other value skips OTP (password-only after `/api/otp/request`). TQA writes `USE_OTP` from GitHub secret (omit/false for testing without SMTP). Prod workflow hardcodes `USE_OTP=true`. SMTP send uses 8s/12s timeouts so login does not hang if Office 365 is unreachable. SMTP connects via IPv4 A-record (same as `nc`); TQA previously failed with `ENETUNREACH` on Microsoft AAAA. `nc` success on workxpace/ebudgeting does not prove the HCFI TQA host.
2. POST `/api/otp/request` with email + password
3. HCFI admin → `{ otpRequired: false }` then normal `signIn`
4. Dealer/salesman with OTP on → `{ challengeId, emailHint }`; with OTP off → `{ otpRequired: false }` then password `signIn`
5. `signIn('credentials', { challengeId, otp })` consumes the challenge once
6. Password-only `signIn` for dealer/salesman is rejected (`otp_required`) only when `USE_OTP=true`. Auth.js still reports that as `CredentialsSignin`; the UI must not treat it as a wrong password. Read `USE_OTP` at runtime (do not let Next inline a stale value) so `/api/otp/request` and NextAuth stay in sync.

## Promo live vs snapshot

1. Admin creates a pre-sim with the live wizard (unchanged) and publishes it
2. Snapshot link `/id/pre-sim/{slug}` — frozen summary + QR; CTA “Lanjutkan simulasi ini” goes to live
3. Live link `/id/credit-simulation?promo={slug}` — pick any Jakarta dealer, AddLeadAsset, ResultStep with seeded product/DP/tenor
4. Banner CTA can point to live, snapshot, or a custom URL
5. Visitor can go back to steps 1–4, edit, and submit a real lead

## First-party visitor analytics

1. Public pages fire `page_view`; `ProductCard` fires `product_click`; public + promo-landing wizard fires `sim_start` / `sim_step`; ContactModal success fires `sim_submit`. Dealer quotation and admin pre-sim do not.
2. Events POST to same-origin `/api/t/e` (cookie set on ingest). Rate-limited per IP.
3. Go-live write-back: public lead tracking + admin **Sinkron go-live** (batch of 10 submitted leads) set `hyundaiGoLiveAt` when Adins stage Contract Activation is completed.
4. CMS conversions (numerator = go-live in range): go-live / unique visitors, go-live / simulation starts, go-live / submitted leads. Dashboard CMS counts are unchanged.
5. Follow-up: 90-day event retention/purge is not automatic in this slice.
