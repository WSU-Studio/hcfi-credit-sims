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
- Salesman fee override (Phase 2 Poin 2): quotation `/dealer/quotation` stepper admin fee 500rb + provision 0.5%. Values sent as Hyundai `AdminFeeAmt` / `ProvisionFee` (`PRCNT`) on CalculateProductFromRule, SimulateFinancialCalculate, and SaveFinancialData. Caps from CMS `maxAdminFeeAmt` / `maxProvisionPrcnt`.
- Promo banner live landing (Phase 2 Poin 3): one PreSimulation record, two public URLs. Snapshot `/pre-sim/[slug]` stays QR/read-only. Live `/credit-simulation?promo=[slug]` hydrates the public wizard to ResultStep (Jakarta dealer, new AddLeadAsset, editable, submittable). Banner CMS picks live vs snapshot vs custom CTA. Do not reuse `simulationLeadNo` from the template.

## User Defined Namespaces

- frontend
- backend
- database

## Components

- `OtpChallengeForm` (`app/components/auth/OtpChallengeForm.tsx`) — reusable OTP step for CMS and dealer login
- `usePortalLogin` (`app/hooks/usePortalLogin.ts`) — password → `/api/otp/request` → optional OTP → `signIn`
- SMTP mailer (`lib/email.ts`) — Office 365 SMTP AUTH, same env as workxpace
- Login OTP (`lib/login-otp.ts`, `lib/auth-otp.ts`) — issue/resend/consume hashed 6-digit codes
- `LoginOtpChallenge` Prisma model (`login_otp_challenges`)
- `FeeStepper` + `CustomerPaidFees` — stepper fee quotation salesman
- `lib/salesman-fee.ts` — clamp, provision % vs amount, Hyundai fee request fields
- `PromoLandingWizard` + `usePromoLanding` — bootstrap live step-5 sim from published pre-sim slug
- `BannerCtaFields` — banner CTA: live promo / snapshot QR / custom URL
- `lib/promo-simulation.ts` — Jakarta dealer picker, seed from PreSimulation row, live vs snapshot hrefs

## Patterns

- API inputs: Zod schemas under `lib/security/*-schemas.ts`
- Rate limits: in-memory `lib/ratelimit.ts` + middleware per-IP on login/OTP
- Dealer vs CMS: `USER_TYPES` in `lib/user-types.ts`; OTP required only for `DEALER_ADMIN` and `SALESMAN`
- Email send is best-effort (`sendEmail` returns boolean). OTP issue fails closed if SMTP send fails in production. Local without SMTP logs the code to the server console.
- Pre-sim dual links: snapshot `/pre-sim/[slug]` vs live `/credit-simulation?promo=[slug]` — never mix submit onto the QR page

## Auth OTP flow

1. POST `/api/otp/request` with email + password
2. HCFI admin → `{ otpRequired: false }` then normal `signIn`
3. Dealer/salesman → email OTP, `{ challengeId, emailHint }`
4. `signIn('credentials', { challengeId, otp })` consumes the challenge once
5. Password-only `signIn` for dealer/salesman is rejected (`otp_required`)

## Promo live vs snapshot

1. Admin creates a pre-sim with the live wizard (unchanged) and publishes it
2. Snapshot link `/id/pre-sim/{slug}` — frozen summary + QR; CTA “Lanjutkan simulasi ini” goes to live
3. Live link `/id/credit-simulation?promo={slug}` — pick any Jakarta dealer, AddLeadAsset, ResultStep with seeded product/DP/tenor
4. Banner CTA can point to live, snapshot, or a custom URL
5. Visitor can go back to steps 1–4, edit, and submit a real lead
