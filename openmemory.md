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
- Salesman fee override (Phase 2 Poin 2): quotation `/dealer/quotation` stepper admin fee 500rb. Bounds come from Hyundai `AdminFeeAmt` + `AdminFeeBhv` (Lock / Min / Max / Def). `ResultStep` uses `pickAdminFeeSource(tenorRow, productCard)` so LOCK on either GetListDefaultProductFromRule **or** CalculateProductFromRule wins over DEF 3jt on the other row. LOCK amount is not snapped to 500rb (GIIAS Low Interest 5.525.123 stays exact; GIIAS Low DP 0 stays locked). Product-name stubs must not hardcode `AdminFeeBhv: DEF` / Amt 0 when the Name/FromRule row already has LOCK. Override payload sends locked AdminFeeAmt even if the salesman never touched the stepper; provision is omitted until touched.
- View Summary **Biaya Dibayar Customer** (`FeePaidAmt`) is a **total**: Admin Fee + Provisi + Fiducia. `CalculateProductFromRule` often omits/zeros `FiduciaFeeAmt` even though FinalCalculate already baked ~Rp 1.000.000 into `FeePaidAmt`. `resolveCustomerFeeBreakdown` uses explicit Fiducia if > 0, otherwise remainder `FeePaid − admin − provisi`. Modal order: Admin fee → Provisi → Fiducia → Biaya Dibayar Customer. Pass wizard `adminFeeAmt` into `withCustomerFeeBreakdown` so remainder is not the whole total.
- Promo banner live landing (Phase 2 Poin 3): one PreSimulation record, two public URLs. Snapshot `/pre-sim/[slug]` stays QR/read-only. Live `/credit-simulation?promo=[slug]` hydrates the public wizard to ResultStep (Jakarta dealer, new AddLeadAsset, editable, submittable). Banner CMS picks live vs snapshot vs custom CTA. Do not reuse `simulationLeadNo` from the template.
- Salesman PriceStep discount is **two fields**: read-only **Diskon Promo Dealer** (Sales Promotion lookup / `accumulatePriceDiscounts`) plus editable **Diskon tambahan**. Get Quotation `AssetDiscAmt` is the **sum**. Do not prefill the extra input with the promo amount. `SimulationWizard` stores `discount` (total) and `additionalDiscount` (extra) so back-navigation does not double-count. Public sim still has a single extra field (lookup is dealer-session only).
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
- `lib/salesman-fee.ts` — clamp, provision % vs amount, Hyundai fee request fields
- `PromoLandingWizard` + `usePromoLanding` — bootstrap live step-5 sim from published pre-sim slug
- `BannerCtaFields` — banner CTA: live promo / snapshot QR / custom URL
- `lib/promo-simulation.ts` — Jakarta dealer picker, seed from PreSimulation row, live vs snapshot hrefs
- First-party tracker (`lib/first-party-tracker/`) — client `track()` via sendBeacon, Zod ingest schema, admin summary queries
- `AnalyticsEvent` (`analytics_events`) — `page_view` | `product_click` | `sim_start` | `sim_step` | `sim_submit`; anonymous `visitorId` cookie `hcfi_fp_vid` (not Lead id)
- `Lead.hyundaiGoLiveAt` — first time monitoring shows Contract Activation completed
- Admin Visitor Analytics (`app/(back-office)/admin/analytics/page.tsx`) — traffic, product clicks, funnel, three conversion ratios. Default date range is last 30 inclusive days (`today` and `today - 29`); not persisted in the URL so a full refresh resets it. **Terapkan** always refetches even if Dari/Sampai did not change (repeat click is a refresh; numbers stay the same if no new events).
- Dealer sales promotions (`DealerPromotionForm` / `lib/dealer-promotion.ts`) — **one promo per vendor + model + manufacturing year + trim (`fscCode`)**. Form reuses Hyundai year/variant APIs via `YearTrimFields` + `useVehicleYearAndTrim` (same sequence as quotation SpecificationStep). Period is **inclusive calendar days in Asia/Jakarta**. Lookup `pickDealerPromotion`: exact year+trim first, else legacy model-wide (`manufYear` 0 + empty `fscCode`). PriceStep passes `specs.manufacturingYear` + `specs.fscCode`. Percent discount still uses quotation OTR (trim price). Demo seeder rows include year + `SEED-Txx` trim. `DealerPromotionsTable` shows year · trim; search includes those. Do not show Hyundai `assetCode` in the table. After adding those Prisma columns, run `prisma generate` and **restart** `next dev` — the client is cached on `globalThis`, so a 500 `Unknown argument manufYear` otherwise renders as an empty promo list.

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
