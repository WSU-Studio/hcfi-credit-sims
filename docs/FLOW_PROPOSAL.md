# Proposal Flow Simulasi Kredit - UX Improvement

## Analisis Flow Existing vs Flow Baru

### Flow Existing (Masalah UX):
1. Pilih cabang → 2. Pilih tipe mobil (dengan filter) → 3. Pilih model → 4. Pilih exterior → 5. Pilih interior → 6. Pilih produk kredit → 7. Kalkulasi (DP 10%, ADDM/ADDB, pilih tenor) → 8. Quotation detail → 9. Contact info

**Masalah:**
- Terlalu banyak step (9 langkah)
- Informasi tersebar di banyak halaman
- User harus bolak-balik untuk compare produk
- Quotation terlalu detail di satu halaman (overwhelming)

### Flow Baru (Proposed - UX Better):

#### **Step 1: Pilih Dealer** ✅ (Sudah ada)
- Pilih kota → Pilih dealer
- **Improvement:** Tampilkan dealer terdekat berdasarkan lokasi (jika ada geolocation)

#### **Step 2: Pilih Model dengan Filter Kategori** 🔄 (Perlu update)
- **Filter kategori:** ALL, SUV, EV, MPV (horizontal tabs)
- Grid cards dengan gambar mobil (jika ada)
- Harga starting price
- **Improvement:** 
  - Visual cards lebih menarik
  - Filter kategori lebih prominent
  - Search/filter by name (optional)

#### **Step 3: Pilih Spesifikasi** ✅ (Sudah ada, tapi bisa diimprove)
- Tahun Produksi → Varian/Trim → Exterior → Interior
- **Improvement:**
  - Tampilkan preview harga per varian (jika berbeda)
  - Visual color picker (jika ada gambar warna)
  - Auto-advance setelah pilih (sudah ada)

#### **Step 4: Input Harga OTR** ✅ (Sudah ada dengan validasi)
- Input harga OTR
- **Improvement:** Sudah ada validasi ✅

#### **Step 5: Pilih Produk Kredit & Kalkulasi** 🔄 (Perlu redesign besar)
**Ini adalah step kunci untuk UX improvement!**

**Struktur:**
```
┌─────────────────────────────────────────┐
│  [Standard] [Promotion]  ← Tabs         │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐│
│  │Product 1 │  │Product 2 │  │Product 3 ││  ← Product cards
│  │DP Ringan │  │DP Medium │  │DP High  ││
│  │10% DP    │  │20% DP    │  │30% DP   ││
│  └─────────┘  └─────────┘  └─────────┘│
├─────────────────────────────────────────┤
│  Selected: Product DP Ringan           │
│  ┌───────────────────────────────────┐ │
│  │ Payment Type: [ADDM] [ADDB]       │ │  ← Toggle
│  │ DP: 10% (Rp 72.400.000)            │ │
│  │                                     │ │
│  │ Tenor: [12] [24] [36] [48] [60]    │ │  ← Tenor buttons
│  │ Selected: 36 bulan                 │ │
│  │                                     │ │
│  │ Angsuran: Rp 20.921.000/bulan      │ │  ← Real-time calculation
│  │ Total Payment: Rp 864.829.425      │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Improvement:**
- **Semua dalam 1 step:** Pilih produk + pilih tenor + lihat hasil langsung
- **Real-time calculation:** Ketika pilih tenor, langsung update angsuran
- **Visual comparison:** Semua produk terlihat sekaligus, mudah compare
- **Less clicks:** Tidak perlu ke halaman terpisah untuk pilih tenor

#### **Step 6: Quotation Detail** 🆕 (Halaman baru)
**Halaman terpisah dengan breakdown lengkap**

**Struktur:**
```
┌─────────────────────────────────────────┐
│  [Kembali]              [Download PDF]  │
├─────────────────────────────────────────┤
│  QUOTATION SIMULASI KREDIT              │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Vehicle Info                       │ │
│  │ Model: SANTA FE                    │ │
│  │ Trim: SIGNATURE                    │ │
│  │ Exterior: MIDNIGHT BLACK PEARL    │ │
│  │ Interior: OBSIDIAN BLACK           │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Credit Summary                      │ │
│  │ Product: Product DP Ringan         │ │
│  │ OTR: Rp 724.000.000                 │ │
│  │ DP: 10% (Rp 72.400.000)             │ │
│  │ Tenor: 36 bulan                     │ │
│  │ Angsuran: Rp 20.921.000/bulan       │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Total Down Payment Breakdown        │ │
│  │ • Down Payment: Rp 71.185.000       │ │
│  │ • First Installment (ADDM): Rp 20.921.000│
│  │ • Insurance: Rp 23.675.125          │ │
│  │ • Admin Fee: Rp 2.000.000           │ │
│  │ • Provision: Rp 14.237.000           │ │
│  │ • Fiducia: Rp 1.000.000              │ │
│  │ ─────────────────────────────────   │ │
│  │ Total DP: Rp 132.594.425            │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Payment Schedule                    │ │
│  │ Month 1-35: Rp 20.921.000           │ │
│  │ Month 36: Rp 20.921.000             │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [Lanjutkan ke Form Kontak]              │
└─────────────────────────────────────────┘
```

**Improvement:**
- **Clean layout:** Informasi terorganisir dengan baik
- **Download PDF:** User bisa download quotation
- **Progressive disclosure:** Breakdown detail bisa expand/collapse
- **Clear CTA:** Langsung ke form kontak

#### **Step 7: Contact Information** 🆕 (Halaman baru)
**Form sederhana untuk lead generation**

**Struktur:**
```
┌─────────────────────────────────────────┐
│  [Kembali]                              │
├─────────────────────────────────────────┤
│  Informasi Kontak                       │
│  Kami akan menghubungi Anda untuk      │
│  melanjutkan proses kredit.            │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Nama Lengkap *                     │ │
│  │ [________________________]         │ │
│  │                                     │ │
│  │ No. Telepon *                      │ │
│  │ [________________________]         │ │
│  │                                     │ │
│  │ Email (Optional)                   │ │
│  │ [________________________]         │ │
│  │                                     │ │
│  │ ☑ Saya setuju menerima notifikasi  │ │
│  │   via WhatsApp, telepon, atau email│ │
│  └────────────────────────────────────┘ │
│                                          │
│  [Kirim Permintaan]                     │
└─────────────────────────────────────────┘
```

**Improvement:**
- **Minimal fields:** Hanya nama & telepon wajib
- **Clear consent:** Checkbox untuk persetujuan notifikasi
- **Trust indicators:** Logo, security badges (optional)

---

## Perbandingan Flow

| Aspect | Existing | Proposed | Benefit |
|--------|----------|----------|---------|
| **Total Steps** | 9 steps | 7 steps | Lebih cepat, less friction |
| **Product Selection** | Step terpisah | Integrated dengan kalkulasi | Less clicks, better UX |
| **Tenor Selection** | Di halaman kalkulasi | Di step produk kredit | Real-time, lebih intuitif |
| **Quotation** | Overwhelming detail | Clean, organized | Lebih mudah dibaca |
| **Contact Form** | Di akhir flow | Step terpisah | Clear CTA, better conversion |

---

## Implementasi yang Perlu Dibuat

### 1. Update ModelStep dengan Filter Kategori
- [ ] Tambah filter tabs: ALL, SUV, EV, MPV
- [ ] Filter assets berdasarkan AssetCategoryName
- [ ] Update UI untuk lebih visual

### 2. Redesign Step 5: Product Selection & Calculation
- [ ] Buat component `ProductSelectionStep`
- [ ] Tabs Standard/Promotion
- [ ] Product cards dengan DP % dan highlight
- [ ] Toggle ADDM/ADDB
- [ ] Tenor selector (12, 24, 36, 48, 60)
- [ ] Real-time calculation display
- [ ] API call untuk calculate per tenor

### 3. Buat Halaman Quotation Detail
- [ ] Route: `/simulasi-kredit/quotation`
- [ ] Component `QuotationDetail`
- [ ] Breakdown lengkap (DP, insurance, fees, dll)
- [ ] Download PDF functionality (optional)
- [ ] Navigation ke contact form

### 4. Buat Halaman Contact Form
- [ ] Route: `/simulasi-kredit/contact`
- [ ] Component `ContactForm`
- [ ] Form validation
- [ ] Submit ke API (Create Lead)
- [ ] Success page / redirect

### 5. Update Types & Mock API
- [ ] Tambah type untuk ADDM/ADDB
- [ ] Update mock API untuk support multiple tenor calculation
- [ ] Update ProductCalculation type untuk support multiple tenors

---

## Rekomendasi UX Best Practices

### 1. Progressive Disclosure
- Tampilkan informasi penting dulu
- Detail bisa expand/collapse
- Jangan overwhelm user dengan terlalu banyak info sekaligus

### 2. Visual Feedback
- Loading states untuk setiap API call
- Success/error messages yang jelas
- Highlight selected options

### 3. Mobile-First Design
- Responsive untuk semua screen sizes
- Touch-friendly buttons (min 44x44px)
- Swipe gestures untuk mobile (optional)

### 4. Performance
- Lazy load images
- Optimize API calls
- Cache data jika memungkinkan

### 5. Accessibility
- Proper ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast yang baik

---

## Next Steps

1. ✅ Review proposal ini dengan stakeholder
2. ⏳ Implement Step 2: Update ModelStep dengan filter kategori
3. ⏳ Implement Step 5: Redesign Product Selection & Calculation
4. ⏳ Implement Step 6: Quotation Detail page
5. ⏳ Implement Step 7: Contact Form page
6. ⏳ Update types & mock API untuk support multiple tenors
7. ⏳ Testing & refinement
