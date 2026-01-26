# Mock API Documentation

Dokumentasi untuk Mock API yang digunakan untuk simulasi kredit ketika VPN belum tersedia atau API real belum bisa diakses.

## Overview

Mock API dibuat untuk memungkinkan development dan testing tanpa perlu akses VPN ke API real dari klien. Mock API mengimplementasikan semua endpoint yang diperlukan untuk simulasi kredit dengan data dan logika perhitungan yang realistis.

### Perbandingan dengan Postman Collection (HCSR3 - Integration LOS Mobile X Website v1.1)

Mock API mengikuti **struktur** request/response dari collection tersebut (dokumentasi: `CREDIT_SIMULATION_API_BREAKDOWN.md`):

| Collection / API Real | Mock API |
|-----------------------|----------|
| Base URL eksternal | Route internal `/api/simulation/*` |
| `ReturnObject` / `ListAssetMasterObj` / `ListProductObj` | ✅ Same shape |
| `HeaderObj`, `StatusCode`, `Message` | ✅ Same shape |
| Endpoints: Vendors, Assets, ManufYear, Variants, Exterior/Interior Colors, Calculate | ✅ Semua di-mock |

**Perbedaan:**

- **Data**: Mock memakai data statis (vendor, model, warna, dll.) untuk simulasi. API real mengambil dari backend.
- **Perhitungan kredit**: Mock memakai formula anuitas sederhana; API real memakai rule engine mereka (`GetListProductFromRuleByLeadNo`). Nilai DP, bunga, tenor, dll. bisa berbeda.
- **Lead / Create Lead**: API real butuh Create Lead dulu → dapat `LeadNo` → lalu hitung. Mock bisa hitung langsung pakai `otrPrice` tanpa `LeadNo`.

Jadi **struktur** mengikuti collection; **sumber data dan logika kredit** disederhanakan untuk development tanpa VPN.

## Konfigurasi

### Environment Variables

Mock API dapat diaktifkan dengan mengatur environment variable berikut:

```bash
# Aktifkan mock mode secara eksplisit
USE_MOCK_API=true

# Atau mock akan otomatis aktif di development mode
NODE_ENV=development
```

**Catatan:** Jika `USE_MOCK_API=true`, semua API akan menggunakan mock data. Jika tidak di-set, sistem akan mencoba menggunakan API real terlebih dahulu, dan akan fallback ke mock API jika terjadi error.

## Mekanisme Kredit (OTR vs DP)

### Apa itu OTR dan DP?

- **OTR (On The Road)** = **Total harga kendaraan** yang akan dibiayai. Ini harga mobil lengkap (belum dipotong apapun). Bukan uang muka.
- **DP (Down Payment)** = **Uang muka** yang Anda bayar di muka. Di sistem ini, DP dihitung sebagai **persentase dari OTR** (mis. 10%, 20%, 30%).
- **Pokok pinjaman** = OTR − DP. Inilah yang dibiayai dan dicicil.

### Alur perhitungan

1. Anda input **Harga OTR** di Step 4 (mis. Rp 724.000.000 untuk Santa Fe).
2. Sistem menawarkan beberapa **produk** dengan DP % dan tenor berbeda:
   - Contoh: Loan Low DP → 10% DP, 36 bulan.
3. Untuk tiap produk:
   - DP = OTR × (persentase DP)
   - Pokok pinjaman = OTR − DP
   - Angsuran per bulan dihitung dari pokok pinjaman + bunga (formula anuitas).

### Kenapa input 100 juta bisa bikin cicilan “2 jutaan”?

- Di Step 4, yang diminta adalah **Harga OTR**, bukan DP.
- Jika Anda isi **100.000.000** sebagai OTR, sistem menganggap **total harga mobil = Rp 100 juta**.
- Maka:
  - DP 10% = Rp 10 juta, pokok pinjaman = Rp 90 juta.
  - Dengan tenor 36 bulan dan bunga tertentu → angsuran memang bisa sekitar **Rp 2–3 juta/bulan**.

Jadi cicilan “2 jutaan” itu **konsisten** dengan asumsi OTR = 100 juta. Masalahnya: untuk Santa Fe (harga ~724 juta), **OTR tidak boleh 100 juta**. OTR harus mendekati harga mobil (min. harga starting model).

### Validasi di aplikasi

- Step 4 (Harga) memvalidasi: **Harga OTR ≥ harga starting** model yang dipilih.
- Jika Anda isi 100 juta untuk mobil 724 juta, form akan menolak dan mengingatkan bahwa OTR adalah total harga mobil, bukan uang muka.

### Ringkasan

| Konsep | Arti |
|--------|------|
| **OTR** | Total harga mobil (yang Anda input di Step 4) |
| **DP** | Uang muka (% dari OTR), dihitung sistem |
| **Pokok pinjaman** | OTR − DP |
| **Angsuran** | Cicilan per bulan (pokok + bunga) |

## Endpoints yang Tersedia

### 1. Get List Vendor & City
**Route:** `POST /api/simulation/vendors`

**Request:**
```json
{
  "hasAvailableAssetOnly": true,
  "hasCmoAssignedOnly": true
}
```

**Response:**
```json
{
  "ReturnObject": [
    {
      "VendorCode": "A11AD12406",
      "VendorName": "HYUNDAI TANGERANG CITY",
      "ZipCode": "15118",
      "City": "TANGERANG",
      "OriOfficeCode": "11",
      "OriOfficeName": "DKI JAKARTA"
    }
  ],
  "HeaderObj": {
    "ResponseTime": "5 ms",
    "StatusCode": "200",
    "Message": "Success",
    "ErrorMessages": null
  }
}
```

### 2. Get All Asset Master (Models)
**Route:** `POST /api/simulation/assets`

**Request:**
```json
{
  "DealerCode": "A11AD12406",
  "GetLatestAsset": true
}
```

**Response:**
```json
{
  "ListAssetMasterObj": [
    {
      "AssetCategoryName": "SUV",
      "AssetCode": "4U",
      "AssetName": "THE ALL NEW SANTA FE",
      "Price": 724000000,
      "FullAssetCode": "HYUNDAI4U",
      "ManufacturingYear": 2025
    }
  ]
}
```

**Mock Data Models:**
- THE ALL NEW SANTA FE (SUV) - Rp 724.000.000
- CRETA (SUV) - Rp 389.000.000
- STARIA (MPV) - Rp 549.000.000
- TUCSON (SUV) - Rp 519.000.000
- IONIQ 5 (EV) - Rp 699.000.000

### 3. Get Manufacturing Years
**Route:** `POST /api/simulation/manufacturing-years`

**Request:**
```json
{
  "ModelCode": "4U",
  "DealerCode": "A11AD12406"
}
```

**Response:**
```json
{
  "ReturnObject": [
    { "Key": 2024, "Value": 2024 },
    { "Key": 2025, "Value": 2025 }
  ]
}
```

### 4. Get Asset Variants (Trims)
**Route:** `POST /api/simulation/variants`

**Request:**
```json
{
  "ModelCode": "4U",
  "DealerCode": "A11AD12406",
  "ManufYear": 2025
}
```

**Response:**
```json
{
  "ReturnObject": [
    {
      "Key": "4UW7D5G1FEV1GG004",
      "Value": "SANTA FE HEV PRIME"
    }
  ]
}
```

### 5. Get Exterior Colors
**Route:** `POST /api/simulation/colors/exterior`

**Request:**
```json
{
  "FscCode": "4UW7D5G1FEV1GG004",
  "ManufYear": 2025
}
```

**Response:**
```json
{
  "ReturnObject": [
    { "Key": "NB9", "Value": "MIDNIGHT BLACK PEARL" },
    { "Key": "SWP", "Value": "SNOW WHITE PEARL" }
  ]
}
```

### 6. Get Interior Colors
**Route:** `POST /api/simulation/colors/interior`

**Request:**
```json
{
  "FscCode": "4UW7D5G1FEV1GG004",
  "ManufYear": 2025,
  "ExtColorCode": "NB9"
}
```

**Response:**
```json
{
  "ReturnObject": [
    { "Key": "4NB", "Value": "BLACK" },
    { "Key": "4BE", "Value": "BEIGE" }
  ]
}
```

### 7. Calculate Credit Products
**Route:** `POST /api/simulation/calculate`

**Request:**
```json
{
  "LeadNo": "MOCK-LEAD-001",
  "otrPrice": 724000000
}
```

**Catatan:** Di mock mode, `otrPrice` dapat digunakan langsung tanpa `LeadNo`. Jika `LeadNo` tidak tersedia, gunakan `otrPrice` saja.

**Response:**
```json
{
  "ListProductObj": [
    {
      "ProductCode": "RF",
      "ProductName": "Loan Low DP",
      "TdpAmt": 72400000,
      "InstallmentAmt": 25388800,
      "InstallmentSchemeCode": "RF",
      "Default": true,
      "DPPrcnt": 10,
      "DPPrcntBhv": "Min",
      "Tenor": 36,
      "FirstInstallment": "ADDB",
      "EffRatePrcnt": 12,
      "EffRateBhv": "LOCK",
      "BalloonAmt": 0,
      "DefermentPeriod": 0,
      "AdminFeeAmt": 2000000,
      "AdminFeeCptlz": false,
      "ProvisionType": "PRCNT",
      "ProvisionFee": 2,
      "FiduciaFeeAmt": 1000000
    }
  ]
}
```

## Logika Perhitungan Kredit

Mock API mengimplementasikan logika perhitungan kredit yang realistis menggunakan formula anuitas:

### Formula Anuitas
```
Angsuran = (Pokok Pinjaman × Bunga Bulanan × (1 + Bunga Bulanan)^Tenor) / ((1 + Bunga Bulanan)^Tenor - 1)
```

### Produk yang Tersedia

1. **Loan Low DP** (10% DP, 36 bulan)
   - DP: 10% dari OTR
   - Bunga: 12% per tahun
   - Tenor: 36 bulan

2. **Loan Medium DP** (20% DP, 48 bulan)
   - DP: 20% dari OTR
   - Bunga: 11% per tahun
   - Tenor: 48 bulan

3. **Loan High DP** (30% DP, 60 bulan)
   - DP: 30% dari OTR
   - Bunga: 10% per tahun
   - Tenor: 60 bulan

4. **Lo Cicilan Paling Murah** (15% DP, 36 bulan, Promo)
   - DP: 15% dari OTR
   - Bunga: 9.5% per tahun (promo)
   - Tenor: 36 bulan
   - Admin Fee: Rp 1.500.000 (lebih murah)
   - Provision: 1.5% (lebih murah)

### Biaya Tambahan

- **Admin Fee:** Rp 2.000.000 (kecuali produk promo)
- **Provision Fee:** 2% dari pokok pinjaman (kecuali produk promo)
- **Fiducia Fee:** Rp 1.000.000

## Cara Menggunakan

### Development Mode (Otomatis Mock)

Di development mode, mock API akan otomatis aktif:

```bash
npm run dev
```

### Production Mode dengan Mock

Untuk menggunakan mock di production (untuk testing):

```bash
USE_MOCK_API=true npm run build
USE_MOCK_API=true npm start
```

### Fallback Mode (Default)

Jika tidak mengatur `USE_MOCK_API`, sistem akan:
1. Mencoba menggunakan API real terlebih dahulu
2. Jika terjadi error (timeout, connection refused, dll), otomatis fallback ke mock API
3. Log error akan ditampilkan di console untuk debugging

## Testing

### Test dengan Mock Data

1. Pastikan `USE_MOCK_API=true` di `.env` atau environment
2. Jalankan aplikasi: `npm run dev`
3. Akses halaman simulasi kredit: `/simulasi-kredit`
4. Pilih dealer, model, spesifikasi, dan input harga OTR
5. Sistem akan menghitung menggunakan mock API

### Test Flow Lengkap

1. **Step 1: Pilih Dealer**
   - Pilih salah satu dealer dari list (mock data)

2. **Step 2: Pilih Model**
   - Pilih model mobil (SANTA FE, CRETA, dll)

3. **Step 3: Pilih Spesifikasi**
   - Tahun produksi: 2024 atau 2025
   - Trim/Varian: Pilih sesuai model
   - Warna Eksterior: Pilih warna
   - Warna Interior: Pilih warna interior

4. **Step 4: Input Harga OTR**
   - Input harga OTR (atau gunakan harga default dari model)

5. **Step 5: Lihat Hasil Simulasi**
   - Sistem akan menampilkan 4 produk kredit dengan perhitungan lengkap
   - User dapat memilih produk dan melihat detail

## File Structure

```
lib/
  └── mock-api.ts          # Mock API service dengan semua data dan logika

app/api/simulation/
  ├── vendors/route.ts      # Updated dengan mock fallback
  ├── assets/route.ts       # Updated dengan mock fallback
  ├── manufacturing-years/route.ts
  ├── variants/route.ts
  ├── colors/
  │   ├── exterior/route.ts
  │   └── interior/route.ts
  └── calculate/route.ts    # Updated dengan mock fallback
```

## Catatan Penting

1. **LeadNo:** Di mock mode, `LeadNo` tidak wajib. Sistem dapat menggunakan `otrPrice` langsung untuk perhitungan.

2. **Data Realistis:** Mock data dirancang untuk memberikan pengalaman yang mirip dengan API real, namun nilai-nilai perhitungan adalah simulasi.

3. **Switching ke Real API:** Ketika VPN tersedia, cukup hapus atau set `USE_MOCK_API=false`, dan sistem akan menggunakan API real.

4. **Error Handling:** Semua route memiliki error handling yang baik dan akan fallback ke mock jika terjadi masalah dengan API real.

## Troubleshooting

### Mock API tidak aktif
- Pastikan `USE_MOCK_API=true` di environment variables
- Atau pastikan `NODE_ENV=development`

### Perhitungan tidak muncul
- Pastikan `otrPrice` dikirim ke endpoint `/api/simulation/calculate`
- Check console untuk error messages

### Data tidak sesuai
- Mock data dapat diubah di `lib/mock-api.ts`
- Pastikan struktur data sesuai dengan type definitions di `app/types/credit-simulation.ts`

## Update Mock Data

Untuk mengupdate mock data, edit file `lib/mock-api.ts`:

- **Vendors:** Update array `MOCK_VENDORS`
- **Models:** Update array `MOCK_ASSET_MASTERS`
- **Variants:** Update object `MOCK_VARIANTS`
- **Colors:** Update arrays `MOCK_EXTERIOR_COLORS` dan `MOCK_INTERIOR_COLORS`
- **Calculation Logic:** Update function `calculateCreditProducts()`

## Next Steps

Ketika VPN tersedia dan API real dapat diakses:

1. Set `USE_MOCK_API=false` atau hapus environment variable
2. Pastikan `CREDIT_SIMULATION_API_URL` sudah benar di `.env`
3. Test dengan API real
4. Mock API akan tetap tersedia sebagai fallback jika terjadi error
