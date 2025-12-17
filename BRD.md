BUSINESS REQUIREMENTS DOCUMENT (BRD)
Credit Simulation Web Application
1. Executive Summary

Credit Simulation Web Application adalah aplikasi berbasis web yang berfungsi sebagai kanal simulasi kredit pembiayaan kendaraan untuk calon konsumen. Aplikasi ini berdiri sebagai subdomain terpisah dari website utama perusahaan dan berfungsi sebagai:
- Media simulasi kredit (estimasi cicilan, tenor, DP, bunga)
- Media lead acquisition (Apply Now / WhatsApp)
- Media informasi promo, produk, dan lokasi cabang
- Jembatan antara calon konsumen dan Core System Kredit melalui API
Aplikasi ini bersifat read-only terhadap Core System (kecuali submit lead), dengan fokus pada performa, keamanan, dan kemudahan penggunaan.

2. Business Objectives

- Memberikan pengalaman simulasi kredit yang cepat, ringan, dan akurat
- Meningkatkan konversi calon konsumen menjadi lead
- Mengurangi beban CS manual untuk simulasi awal
- Menyediakan media promosi terpusat (banner, promo, katalog)
- Menjadi landing page marketing yang SEO-friendly

3. Scope

3.1 In Scope
- Landing page credit simulation
- Modul simulasi kredit kendaraan
- Integrasi API ke Core System (read)
- Form Apply / WhatsApp redirect
- Modul promo & artikel
- Cabang & dealer locator
- Admin panel sederhana untuk konten statis

3.2 Out of Scope
- Approval kredit
- Transaksi keuangan
- Manajemen kontrak
- Login user end-customer
- Perubahan data di Core System

4. Stakeholders

Role: Responsibility
- Business Owner: Menentukan kebijakan produk & promo
- Marketing: Konten, campaign, banner
- IT / Developer: Implementasi & integrasi
- Core System Team: Penyedia API simulasi
- Security / Compliance: VA & hardening

5. User Personas

5.1 End User (Calon Konsumen)
- Mobile-first
- Tidak login
- Ingin estimasi cepat
- Menghubungi via WhatsApp / form

5.2 Admin Internal
- Mengelola banner
- Mengelola promo & artikel
- Update data cabang

6. Functional Requirements

6.1 Landing Page (Homepage)

Deskripsi:
Halaman utama yang menampilkan ringkasan simulasi dan konten marketing.

Fitur:
- Hero banner (carousel)
- CTA “Simulasikan Kredit”
- Highlight promo
- Quick simulation (ringkas)
- Footer informasi legal

Acceptance Criteria:
- Load < 3 detik
- Mobile friendly
- SEO meta tersedia

6.2 Credit Simulation Module

Flow:
- Pilih lokasi / dealer
- Pilih brand & tipe kendaraan
- Pilih varian
- Input:
  - Harga OTR
  - DP (% / nominal)
  - Tenor
- Sistem hitung:
  - Angsuran
  - Bunga
  - Asuransi
- Tampilkan hasil simulasi

Rules:
- Semua perhitungan bersumber dari API Core System
- Tidak ada kalkulasi hardcoded di frontend

Acceptance Criteria:
- Data real-time / near real-time
- Error API ditangani dengan fallback message

6.3 Apply Now / Lead Submission
Opsi:
- Redirect WhatsApp (prefilled message)
- Submit form (nama, HP, lokasi, unit)

Data dikirim:
- Data simulasi
- Informasi user
- Timestamp

6.4 Promo & Artikel
- List promo aktif
- Detail promo
- Artikel edukatif kredit

6.5 Branch & Dealer Locator
- List cabang
- Filter wilayah
- Map integration
- Kontak cabang

6.6 Admin Panel
- CRUD Banner
- CRUD Promo
- CRUD Artikel
- CRUD Cabang
Role:
- Admin internal (tanpa hirarki kompleks)

7. Non-Functional Requirements

7.1 Performance
- TTFB < 1 detik
- Page load < 3 detik
- API timeout handling

7.2 Security
- HTTPS wajib
- Input validation
- Rate limit form submit
- Vulnerability Assessment sebelum go-live

7.3 Availability
- Uptime target 99%
- Graceful degradation jika API Core System down

7.4 Scalability
- Stateless frontend
- API caching (read-heavy)

8. Assumptions & Constraints

API Core System sudah tersedia
- Format response stabil
- Website ini tidak menyimpan data sensitif finansial

TECHNICAL SPECIFICATION
9. Architecture Overview

High Level:
User Browser
   ↓
Next.js Web App
   ↓
Core System API (Simulation)
   ↓
Local DB (Content only)

10. Technology Stack

10.1 Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod (schema validation)
- TanStack Query

10.2 Backend (Lightweight)
- Next.js API Routes / Server Actions
- Prisma ORM

10.3 Database
- PostgreSQL
- Data:
  - banners
  - promos
  - articles
  - branches
  - lead_logs (optional)

10.4 Integration
- REST API Core System
- WhatsApp deep link
- Map Provider (Google / Mapbox)

11. Database Design (Simplified)

- banners
  - id
  - title
  - image_url
  - is_active
  - order
- promos
  - id
  - title
  - description
  - image_url
  - is_active
  - order
- articles
  - id
  - title
  - slug
  - content
  - published_at
- branches
  - id
  - name
  - city
  - lat
  - lng
  - phone
  - created_at
- lead_logs (optional)
  - id
  - name
  - phone
  - payload_json
  - created_at

12. API Integration Specification

12.1 Core System API
- GET vehicle list
- GET variant list
- POST simulate credit
- Error Handling: Timeout → fallback message, Invalid response → logged

13. Security Controls

- CSP & Security Headers
- Rate limit apply endpoint
- Sanitization input
- Dependency audit

14. Deployment

- Vercel / Docker VM
- CI/CD via GitHub Actions
- Environment: dev, staging, production

15. Testing Strategy

- Unit test: calculator flow
- Integration test: API mock
- E2E test: Playwright
- UAT sebelum go-live

16. Deliverables

- Source code
- Environment config
- API documentation
- Admin user guide
- VA report

17. Success Metrics (KPI)

- Page load time
- Conversion rate
- Drop-off di simulasi
- WhatsApp click-through