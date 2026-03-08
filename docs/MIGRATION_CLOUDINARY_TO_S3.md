# Panduan Migrasi: Cloudinary → AWS S3

Dokumen ini memandu langkah demi langkah untuk mengubah media storage dari Cloudinary ke S3, sehingga semua service tetap di ekosistem AWS.

---

## Ringkasan Perubahan

| Sebelum (Cloudinary) | Sesudah (S3) |
|---------------------|--------------|
| `cloudinary` SDK | `@aws-sdk/client-s3` |
| `next-cloudinary` (CldImage) | `next/image` atau `<img>` |
| `CLOUDINARY_*` env vars | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION` |
| `cloudinaryId` di DB | `s3Key` (opsional, untuk referensi) |
| Import dari Cloudinary | Dihapus atau dijadikan one-time migration |

---

## Step 1: Buat S3 Bucket di AWS

1. Login ke [AWS Console](https://console.aws.amazon.com/) → S3
2. **Create bucket**
3. Nama bucket: mis. `hcfi-credit-sims-media` (harus unik global)
4. Region: pilih sama dengan EB (mis. `ap-southeast-1`)
5. **Block Public Access**: 
   - Untuk public read: matikan "Block all public access" (jika gambar perlu diakses langsung via URL)
   - Untuk private: tetap block, nanti pakai presigned URL atau CloudFront
6. **Bucket policy** (untuk public read):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::hcfi-credit-sims-media/hcfi_media/*"
       }
     ]
   }
   ```
7. **CORS** (bucket → Permissions → CORS):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

---

## Step 2: IAM untuk Aplikasi

### Opsi A: Gunakan IAM User (untuk GitHub Actions + EB)

1. IAM → Users → Create user (mis. `hcfi-media-uploader`)
2. Attach policy (atau buat custom policy):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::hcfi-credit-sims-media",
        "arn:aws:s3:::hcfi-credit-sims-media/*"
      ]
    }
  ]
}
```

3. Create access key → simpan `Access Key ID` dan `Secret Access Key`

### Opsi B: IAM Role untuk EB (lebih aman)

Jika EB environment memakai instance profile, attach policy di atas ke role tersebut dan tidak perlu menyimpan secret di env.

---

## Step 3: Environment Variables

### Di `.env` lokal dan EB (Configuration → Environment properties)

Hapus:
```
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Tambahkan:
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=hcfi-credit-sims-media
```

> Jika memakai IAM Role di EB, `AWS_ACCESS_KEY_ID` dan `AWS_SECRET_ACCESS_KEY` tidak perlu—SDK akan pakai instance credentials.

---

## Step 4: Install & Uninstall Paket

```bash
npm uninstall cloudinary next-cloudinary
npm install @aws-sdk/client-s3
```

---

## Step 5: Update Kode Aplikasi

### 5.1 Upload Route (`app/api/admin/media/upload/route.ts`)

- Ganti logic upload ke S3 dengan `PutObjectCommand`
- Simpan URL publik: `https://{bucket}.s3.{region}.amazonaws.com/{key}`
- Simpan `s3Key` di DB (mis. `hcfi_media/uuid-filename.jpg`)

### 5.2 Sync Route (`app/api/admin/media/sync/route.ts`)

- **Opsi 1**: Hapus route dan tombol "Import dari Cloudinary" (tidak relevan lagi)
- **Opsi 2**: Buat one-time migration script untuk copy dari Cloudinary ke S3 (jika perlu migrasi media lama)

### 5.3 Prisma Schema (`prisma/schema.prisma`)

- Rename `cloudinaryId` → `s3Key` (opsional, bisa tetap pakai `cloudinaryId` untuk backward compatibility dengan data lama)
- Atau tambah kolom `s3Key`, biarkan `cloudinaryId` untuk data lama

### 5.4 Media API POST (`app/api/admin/media/route.ts`)

- Ganti `cloudinaryId` → `s3Key` (atau terima keduanya untuk backward compat)

### 5.5 Komponen yang Pakai `CldImage`

File:
- `BannersTable.tsx`
- `ProductsTable.tsx`
- `ArticlesTable.tsx`
- `MediaPicker.tsx` (jika uncomment)

Ubah: ganti `CldImage` dengan `Image` dari `next/image` atau `<img>` untuk URL eksternal. S3 URL format: `https://bucket.s3.region.amazonaws.com/key`. Kondisi `imageUrl.includes('cloudinary')` diganti jadi cek S3 URL atau pakai `Image` untuk semua URL (Next.js sudah support `**.amazonaws.com` di `remotePatterns`).

### 5.6 `next.config.js`

- `**.amazonaws.com` sudah ada di `remotePatterns`
- Hapus `**.cloudinary.com` jika tidak ada URL Cloudinary lagi

### 5.7 MediaLibrary & Docs

- Update placeholder/teks dari "Cloudinary" ke "S3"
- Update `docs/CMS_SETUP.md`

---

## Step 6: Migrasi Data Media yang Sudah Ada (Opsional)

Jika ada media lama di Cloudinary yang perlu dipindah ke S3:

1. Script one-time: fetch dari Cloudinary, upload ke S3, update record di DB
2. Atau biarkan URL lama (Cloudinary) tetap berfungsi—jangan hapus `**.cloudinary.com` dari `next.config.js` sampai semua URL sudah S3

---

## Step 7: Deploy ke Elastic Beanstalk

1. Tambahkan env vars di EB:
   - AWS Console → Elastic Beanstalk → pilih Application & Environment
   - Configuration → Software → Edit → Environment properties
   - Tambah:
     - `AWS_S3_BUCKET` = `hcfi-credit-sims-media`
     - `AWS_REGION` = `ap-southeast-1`
     - `AWS_ACCESS_KEY_ID` = (dari IAM)
     - `AWS_SECRET_ACCESS_KEY` = (dari IAM)
   - Juga hapus jika ada: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
2. Apply & Deploy ulang aplikasi

---

## Step 8: Verifikasi

- [ ] Upload media baru → file masuk S3, URL `https://...amazonaws.com/...`
- [ ] Media Library menampilkan gambar
- [ ] Banner/Product/Article dengan gambar baru tampil benar
- [ ] Tidak ada error di log EB

---

## Catatan Keamanan

- Jangan commit `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` ke repo
- Gunakan IAM Role di EB jika memungkinkan
- Untuk production, pertimbangkan CloudFront di depan S3 untuk caching & HTTPS
