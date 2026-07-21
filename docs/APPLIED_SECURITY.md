# Applied Security Controls / Kontrol Keamanan yang Diterapkan

**Project:** HCFI Credit Simulation Website (Hyundai Capital Finance Indonesia)  
**Scope:** Application-layer security on the Next.js platform  
**Status:** Implemented & deployed (major QA flows verified; CSP enforce via env flag)  
**Date:** July 2026

---

## Bahasa Indonesia

### 1. Ringkasan Eksekutif

Keamanan aplikasi telah diperkuat di beberapa lapisan: **browser (CSP & headers)**, **edge/middleware (auth session, CSRF/origin, rate limit login)**, **API (validasi Zod, sanitasi, RBAC, rate limit)**, **auth (lockout, password policy)**, dan **audit trail CMS**.

Kontrol ini **melengkapi** proteksi jaringan yang sudah ada (WAF untuk SSL / brute-force HTTPS), **bukan menggantikannya**.

| Area | Status |
|------|--------|
| Security headers + CSP | Aktif (Report-Only default; enforce via `CSP_ENFORCE`) |
| Auth / session / RBAC | Aktif |
| Rate limiting API sensitif | Aktif |
| Validasi & sanitasi input (publik + CMS) | Aktif |
| Proteksi upload & PII (KTP) | Aktif |
| Audit log mutasi penting | Aktif |
| Password policy | Aktif (min 12 + complexity) |

### 2. Lapisan Pertahanan

```
[Browser] CSP + security headers
    ↓
[Edge/Middleware] Origin check, JWT session gate, login IP rate limit
    ↓
[API Routes] RBAC, Zod schema, sanitize, honeypot, rate limit
    ↓
[Data / Downstream] Prisma parameterized queries, Hyundai API via server only
```

### 3. Detail Kontrol

#### 3.1 Content Security Policy (CSP)

**Tujuan:** Membatasi script/resource yang boleh dijalankan browser → mengurangi dampak XSS & third-party script tidak sah.

**Implementasi:**
- Policy terpusat: `lib/security/csp.ts`
- Dipasang runtime via middleware
- Flag lingkungan:
  - Default / kosong → `Content-Security-Policy-Report-Only`
  - `CSP_ENFORCE=true` → `Content-Security-Policy` (enforce)

**Allowlist utama:**
- `'self'` untuk default
- Google Tag Manager / Analytics (kebutuhan marketing)
- `img-src` mengizinkan `https:` (CDN/media)
- `object-src 'none'`, `frame-ancestors 'self'`

**Catatan untuk infra:** Tidak mengubah WAF/ALB. Hanya response header aplikasi. Rollback QA: `CSP_ENFORCE=false`.

#### 3.2 Security Headers Lain

Dipasang via `next.config.js` (seluruh path):

| Header | Nilai / perilaku |
|--------|------------------|
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera/mic/geolocation dinonaktifkan |
| `Strict-Transport-Security` | HSTS di production |

#### 3.3 Authentication & Session

| Kontrol | Keterangan |
|---------|------------|
| NextAuth (Credentials + JWT) | Session berbasis JWT |
| Middleware session gate | Token JWT **diverifikasi** (bukan hanya cek keberadaan cookie) |
| Protected paths | `/admin`, `/dealer` (non-login), `/api/admin`, `/api/dealer` |
| Account lockout | Persistent di DB setelah gagal login berulang |
| Rate limit login | Per-IP (middleware) + per-email (NextAuth) |
| Password policy | Min **12** karakter + huruf besar + kecil + angka |

#### 3.4 Authorization (RBAC)

- Permission berbasis menu/action (`view` / `create` / `edit` / `delete`)
- Endpoint admin sensitif memakai `requirePermission(...)`
- Contoh: stream KTP (`/api/admin/lead-ktp`) wajib permission **LEADS view**

#### 3.5 CSRF / Cross-Origin Write Protection

- Middleware menolak write API lintas origin yang tidak sah (`lib/security/origin-check.ts`)
- Bypass terbatas untuk NextAuth (punya CSRF sendiri)
- CORS kondisional jika `ALLOWED_ORIGINS` di-set

#### 3.6 Rate Limiting

In-memory limiter per instance (cocok single-instance + WAF; multi-instance → rencana Redis/Upstash).

| Limiter | Target |
|---------|--------|
| Login IP / email | Brute-force login |
| Leads / KTP OCR / tracking | Abuse funnel publik |
| Lead-asset draft | Create lead Hyundai (biaya downstream) |
| Simulation APIs | `/api/simulation/*` |
| Admin Hyundai / upload / sync | Abuse sesi admin |
| Password change | Proteksi password saat ini |

#### 3.7 Input Validation & Sanitization

**Publik (lead & simulasi)**
- Zod: `lib/security/schemas.ts`, `lib/security/simulation-schemas.ts`
- Sanitasi string + anti-injection probe
- Honeypot anti-bot
- Cross-check draft `LeadAssetDraft` untuk lead submission

**CMS / Admin**
- Zod: settings, articles, pages, promos, products (`lib/security/admin-schemas.ts`)
- HTML CMS di-sanitize server-side (DOMPurify allowlist) sebelum persist
- Validasi format GTM (`GTM-…`) & GA4 (`G-…`); inject analytics hanya jika format valid

#### 3.8 File Upload & PII (KTP)

- Validasi tipe gambar (magic bytes) + re-encode (sharp) pada upload KTP
- Akses KTP admin: auth + RBAC + `Cache-Control: private, no-store`
- Media admin: permission + rate limit upload

#### 3.9 Audit Logging

Mutasi penting dicatat (best-effort), termasuk user/role, lead, CMS (article/page/promo/product), settings, dealer promotion, password change. Metadata sensitif di-scrub.

### 4. Area Prioritas yang Di-harden

| Area | Proteksi utama |
|------|----------------|
| `POST /api/leads`, upload/OCR KTP | Zod, rate limit, honeypot, image validation |
| `/api/simulation/*` | Zod + rate limit |
| `/api/public/lead-tracking` | Zod + rate limit + honeypot |
| `/api/admin/*` | Auth JWT + RBAC + schemas CMS |
| `/api/admin/lead-ktp` | Auth + LEADS view |
| Auth login / change-password | Rate limit + lockout + password policy |
| Settings analytics | Format ID + safe inject |

### 5. Verifikasi QA (Internal)

- Simulasi → submit lead → download summary — tanpa CSP block
- Hampir semua flow admin (termasuk upload media)
- Dealer login
- Login/logout setelah hardening JWT — normal di lokal & prod
- GTM/GA live belum diverifikasi penuh (belum ada akses analytic account); domain Google sudah di allowlist CSP

### 6. Batasan & Rencana Lanjutan

| Item | Status |
|------|--------|
| Rate limit in-memory | Per-instance; multi-instance → Redis/Upstash |
| CSP `unsafe-inline` / `unsafe-eval` | Masih dibutuhkan Next.js + GTM; bisa diperketat (nonce) bertahap |
| CSP enforce prod | Disarankan setelah QA `CSP_ENFORCE=true` stabil |
| Penetration test pihak ketiga | Disarankan (app-layer grey-box) |

### 7. Konfigurasi Operasional

```text
# Default: Report-Only
# CSP_ENFORCE tidak di-set atau false

# QA enforce:
CSP_ENFORCE=true

# Rollback cepat:
CSP_ENFORCE=false
```

### 8. Kesimpulan (ID)

Aplikasi credit simulation HCFI memiliki kontrol keamanan application-layer yang terukur: CSP & headers, session/RBAC, origin guard, rate limit, validasi/sanitasi pada funnel publik & CMS, proteksi PII KTP, password policy, dan audit log. Kontrol ini siap mendukung produksi, dengan catatan: enforce CSP penuh di prod setelah QA hijau, dan uji GTM/GA saat ID analytics tersedia.

### Ringkas untuk Infra (1 paragraf)

> CSP di website simulasi kredit HCFI adalah header keamanan browser untuk membatasi script dan resource yang boleh dijalankan, terutama untuk mengurangi risiko XSS dan eksekusi script pihak ketiga yang tidak sah. Ini melengkapi (bukan menggantikan) proteksi WAF di layer jaringan. Policy sudah aktif; mode default Report-Only, dan di QA dapat di-enforce via environment variable `CSP_ENFORCE` tanpa mengubah konfigurasi WAF/SSL.

---

## English

### 1. Executive Summary

Application security has been hardened across multiple layers: **browser (CSP & headers)**, **edge/middleware (session auth, CSRF/origin checks, login rate limits)**, **API (Zod validation, sanitization, RBAC, rate limits)**, **auth (account lockout, password policy)**, and **CMS audit logging**.

These controls **complement** existing network protections (WAF for SSL / HTTPS brute-force); they **do not replace** them.

| Area | Status |
|------|--------|
| Security headers + CSP | Active (Report-Only by default; enforce via `CSP_ENFORCE`) |
| Auth / session / RBAC | Active |
| Rate limiting on sensitive APIs | Active |
| Input validation & sanitization (public + CMS) | Active |
| Upload & PII (KTP/ID card) protection | Active |
| Audit log for key mutations | Active |
| Password policy | Active (min 12 + complexity) |

### 2. Defense Layers

```
[Browser] CSP + security headers
    ↓
[Edge/Middleware] Origin check, JWT session gate, login IP rate limit
    ↓
[API Routes] RBAC, Zod schema, sanitize, honeypot, rate limit
    ↓
[Data / Downstream] Prisma parameterized queries; Hyundai APIs server-side only
```

### 3. Control Details

#### 3.1 Content Security Policy (CSP)

**Purpose:** Restrict which scripts/resources the browser may execute/load → reduce XSS impact and unauthorized third-party scripts.

**Implementation:**
- Central policy: `lib/security/csp.ts`
- Applied at runtime via middleware
- Environment flag:
  - Default / unset → `Content-Security-Policy-Report-Only`
  - `CSP_ENFORCE=true` → `Content-Security-Policy` (enforcing)

**Main allowlist:**
- `'self'` as default
- Google Tag Manager / Analytics (marketing)
- `img-src` allows `https:` (CDN/media)
- `object-src 'none'`, `frame-ancestors 'self'`

**Infra note:** Does not change WAF/ALB. Application response headers only. QA rollback: `CSP_ENFORCE=false`.

#### 3.2 Other Security Headers

Set via `next.config.js` for all paths:

| Header | Value / behavior |
|--------|------------------|
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera/mic/geolocation disabled |
| `Strict-Transport-Security` | HSTS in production |

#### 3.3 Authentication & Session

| Control | Description |
|---------|-------------|
| NextAuth (Credentials + JWT) | JWT-based sessions |
| Middleware session gate | JWT is **verified** (not cookie-presence only) |
| Protected paths | `/admin`, `/dealer` (non-login), `/api/admin`, `/api/dealer` |
| Account lockout | DB-persistent after repeated failed logins |
| Login rate limits | Per-IP (middleware) + per-email (NextAuth) |
| Password policy | Min **12** chars + upper + lower + digit |

#### 3.4 Authorization (RBAC)

- Menu/action permissions (`view` / `create` / `edit` / `delete`)
- Sensitive admin endpoints use `requirePermission(...)`
- Example: KTP image stream (`/api/admin/lead-ktp`) requires **LEADS view**

#### 3.5 CSRF / Cross-Origin Write Protection

- Middleware rejects unauthorized cross-origin API writes (`lib/security/origin-check.ts`)
- Limited bypass for NextAuth (built-in CSRF)
- Conditional CORS when `ALLOWED_ORIGINS` is set

#### 3.6 Rate Limiting

In-memory limiters per instance (fine with single instance + WAF; multi-instance → Redis/Upstash planned).

| Limiter | Target |
|---------|--------|
| Login IP / email | Login brute-force |
| Leads / KTP OCR / tracking | Public funnel abuse |
| Lead-asset draft | Hyundai lead creation (downstream cost) |
| Simulation APIs | `/api/simulation/*` |
| Admin Hyundai / upload / sync | Authenticated abuse |
| Password change | Protect current password |

#### 3.7 Input Validation & Sanitization

**Public (leads & simulation)**
- Zod: `lib/security/schemas.ts`, `lib/security/simulation-schemas.ts`
- String sanitization + malicious-payload probes
- Honeypot anti-bot
- `LeadAssetDraft` cross-check on lead submission

**CMS / Admin**
- Zod for settings, articles, pages, promos, products (`lib/security/admin-schemas.ts`)
- Server-side HTML sanitization (DOMPurify allowlist) before persist
- Strict GTM (`GTM-…`) & GA4 (`G-…`) ID formats; analytics injected only if valid

#### 3.8 File Upload & PII (KTP)

- Image magic-byte validation + sharp re-encode on KTP upload
- Admin KTP access: auth + RBAC + `Cache-Control: private, no-store`
- Admin media: permission + upload rate limit

#### 3.9 Audit Logging

Key mutations are recorded (best-effort), including users/roles, leads, CMS (article/page/promo/product), settings, dealer promotions, password changes. Sensitive metadata is scrubbed.

### 4. Priority Hardened Areas

| Area | Primary controls |
|------|------------------|
| `POST /api/leads`, KTP upload/OCR | Zod, rate limit, honeypot, image validation |
| `/api/simulation/*` | Zod + rate limit |
| `/api/public/lead-tracking` | Zod + rate limit + honeypot |
| `/api/admin/*` | JWT auth + RBAC + CMS schemas |
| `/api/admin/lead-ktp` | Auth + LEADS view |
| Login / change-password | Rate limit + lockout + password policy |
| Analytics settings | ID format + safe inject |

### 5. QA Verification (Internal)

- Simulation → lead submit → summary download — no blocking CSP issues
- Most admin flows (including media upload)
- Dealer login
- Login/logout after JWT hardening — OK on local & prod
- Live GTM/GA not fully verified yet (no analytic account access); Google domains already allowlisted in CSP

### 6. Limitations & Follow-ups

| Item | Status |
|------|--------|
| In-memory rate limits | Per-instance; multi-instance → Redis/Upstash |
| CSP `unsafe-inline` / `unsafe-eval` | Still needed for Next.js + GTM; tighten later with nonces |
| Prod CSP enforce | Recommended after stable QA with `CSP_ENFORCE=true` |
| Third-party penetration test | Recommended (app-layer grey-box) |

### 7. Operational Configuration

```text
# Default: Report-Only
# CSP_ENFORCE unset or false

# QA enforce:
CSP_ENFORCE=true

# Fast rollback:
CSP_ENFORCE=false
```

### 8. Conclusion (EN)

The HCFI credit simulation application has measurable application-layer security: CSP & headers, session/RBAC, origin guards, rate limits, validation/sanitization on public and CMS surfaces, KTP/PII protections, password policy, and audit logging. These controls support production readiness, with the notes to fully enforce CSP in prod after QA is green, and to smoke-test GTM/GA once analytics IDs are available.

### One-paragraph brief for Infrastructure

> CSP on the HCFI credit simulation website is a browser security header that restricts which scripts and resources may run, primarily to reduce XSS risk and unauthorized third-party script execution. It complements (does not replace) WAF protections at the network layer. The policy is already active; the default mode is Report-Only, and QA can switch to enforce via the `CSP_ENFORCE` environment variable without changing WAF/SSL configuration.
