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

## Patterns

- API inputs: Zod schemas under `lib/security/*-schemas.ts`
- Rate limits: in-memory `lib/ratelimit.ts` + middleware per-IP on login/OTP
- Dealer vs CMS: `USER_TYPES` in `lib/user-types.ts`; OTP required only for `DEALER_ADMIN` and `SALESMAN`
- Email send is best-effort (`sendEmail` returns boolean). OTP issue fails closed if SMTP send fails in production. Local without SMTP logs the code to the server console.

## Auth OTP flow

1. POST `/api/otp/request` with email + password
2. HCFI admin → `{ otpRequired: false }` then normal `signIn`
3. Dealer/salesman → email OTP, `{ challengeId, emailHint }`
4. `signIn('credentials', { challengeId, otp })` consumes the challenge once
5. Password-only `signIn` for dealer/salesman is rejected (`otp_required`)
