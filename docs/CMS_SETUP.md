# CMS Back-Office Setup Guide

## Overview

Sistem CMS telah diimplementasikan dengan fitur-fitur berikut:

- ✅ Authentication (Login/Logout) dengan NextAuth
- ✅ Role-Based Access Control (RBAC) dengan granular permission per menu
- ✅ User Management
- ✅ Role & Permission Management
- ✅ Media Library dengan Cloudinary integration
- ✅ CMS Modules: Banner, Product, Promo, Article, Static Pages, Footer Settings

## Setup Instructions

### 1. Environment Variables

Buat file `.env` di root project dengan konfigurasi berikut:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hcfi_credit?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3070"
NEXTAUTH_SECRET="your-secret-key-here" # Generate dengan: openssl rand -base64 32

# Cloudinary (optional, untuk media upload & import - pakai server-only, jangan NEXT_PUBLIC)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 2. Database Setup

1. Pastikan PostgreSQL server sudah running (hcfi-credit di pgAdmin4)
2. Jalankan migration:
```bash
npm run db:migrate
```

3. Generate Prisma Client:
```bash
npm run db:generate
```

4. Seed database dengan data awal (menus, permissions, super admin):
```bash
npm run db:seed
```

**Default Super Admin Credentials:**
- Email: `admin@hcfi.com`
- Password: `admin123`

⚠️ **PENTING:** Ganti password default setelah login pertama kali!

### 3. Cloudinary Setup (Optional)

1. Daftar di [Cloudinary](https://cloudinary.com) (free tier available)
2. Dari Dashboard: Cloud name, API Key, API Secret (Settings → Access keys)
3. Tambahkan di `.env` **tanpa prefix NEXT_PUBLIC** (agar credential tidak terbuka di browser):
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

Upload media dilakukan di server; Import dari Cloudinary juga memakai env ini. Jangan pakai `NEXT_PUBLIC_CLOUDINARY_*` untuk keamanan.

## Struktur CMS Modules

### Menu yang Tersedia:

1. **Dashboard** - Overview statistik
2. **User Management** - Kelola user dan assign roles
3. **Role & Permission** - Kelola roles dan permissions
4. **Banner Management** - Hero slider banners
5. **Product Section** - Product cards
6. **Promo Management** - Promo list & highlight
7. **Artikel/Berita** - Artikel/berita dengan rich text
8. **Static Pages** - Privacy Policy, T&C, dll
9. **Footer Settings** - Address, contacts, app links
10. **Media Library** - Upload & manage media files

## Permission System

Setiap role memiliki 4 jenis permission per menu:
- **View** - Bisa melihat menu & data
- **Create** - Bisa menambah data baru
- **Edit** - Bisa edit data existing
- **Delete** - Bisa hapus data

Super Admin memiliki full access ke semua menu.

## API Endpoints

### Admin APIs (Protected)
- `/api/admin/users` - User management
- `/api/admin/roles` - Role management
- `/api/admin/banners` - Banner CRUD
- `/api/admin/products` - Product CRUD
- `/api/admin/promos` - Promo CRUD
- `/api/admin/articles` - Article CRUD
- `/api/admin/pages` - Static page CRUD
- `/api/admin/footer` - Footer settings
- `/api/admin/media` - Media library

### Public APIs (No Auth Required)
- `/api/public/banners` - Get active banners
- `/api/public/products` - Get products
- `/api/public/benefits` - Get benefits
- `/api/public/promos` - Get active promos

## Routes

### Public Site
- `/` - Homepage (mengambil data dari CMS)
- `/simulasi-kredit` - Credit simulation page

### Back Office
- `/auth/login` - Login page
- `/auth/logout` - Logout
- `/admin/dashboard` - Dashboard
- `/admin/users` - User management
- `/admin/roles` - Role & permission management
- `/admin/banners` - Banner management
- `/admin/products` - Product management
- `/admin/promos` - Promo management
- `/admin/articles` - Article management
- `/admin/pages` - Static pages
- `/admin/footer` - Footer settings
- `/admin/media` - Media library

## Development

```bash
# Run development server
npm run dev

# Database studio (GUI untuk melihat data)
npm run db:studio
```

## Next Steps

1. ✅ Setup environment variables
2. ✅ Run database migration & seed
3. ✅ Login dengan super admin credentials
4. ✅ Buat roles sesuai kebutuhan (Editor, Viewer, dll)
5. ✅ Assign permissions ke masing-masing role
6. ✅ Buat user baru dan assign roles
7. ✅ Upload media ke Cloudinary (jika digunakan)
8. ✅ Mulai manage content melalui CMS

## Notes

- Semua route `/admin/*` protected dengan middleware
- Permission check dilakukan di server-side untuk security
- Site components sudah terintegrasi dengan CMS (fallback ke default jika DB kosong)
- Media upload menggunakan Cloudinary widget (jika configured)

## Troubleshooting

**Error: "Unauthorized" atau redirect ke login**
- Pastikan sudah login
- Check session di browser

**Error: "Forbidden: Insufficient permissions"**
- User tidak memiliki permission untuk menu tersebut
- Super Admin bisa assign permission di Role Management

**Database connection error**
- Pastikan PostgreSQL running
- Check DATABASE_URL di `.env`
- Pastikan database `hcfi_credit` sudah dibuat

**Media upload tidak bekerja**
- Pastikan Cloudinary environment variables sudah di-set
- Check upload preset name di Cloudinary dashboard


