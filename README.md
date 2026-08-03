# Ruang Aksara

Ruang Aksara adalah website novel mobile-first berbasis Next.js App Router dan Supabase. Aplikasi menyediakan katalog publik, pembaca dengan preferensi lokal, autentikasi, bookmark, progres membaca, komentar termoderasi, dashboard pengguna, serta dashboard admin dengan pemeriksaan authorization di server.

## Stack

- Next.js 16 App Router, React 19, dan TypeScript
- Tailwind CSS 4
- Supabase Database, Auth, dan Storage
- Zod untuk validasi input
- npm dan Node.js 22+
- Vercel sebagai target deployment

## Persyaratan

- Node.js 22 atau lebih baru
- npm
- Project Supabase
- Supabase CLI untuk migration
- Git, GitHub CLI, dan Vercel CLI untuk alur release

## Instalasi lokal

```bash
npm install
copy .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`. Bila Supabase belum dikonfigurasi, katalog development memakai data orisinal lokal dan menampilkan status konfigurasi yang jelas.

## Environment variables

Isi `.env.local` tanpa memasukkan nilainya ke Git:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Hanya publishable key yang boleh berada pada aplikasi. Jangan pernah memakai secret key atau `service_role` di frontend. Untuk production, `NEXT_PUBLIC_SITE_URL` wajib URL HTTPS canonical yang benar-benar aktif.

## Database dan Supabase

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase migration list
npx supabase db push
```

Migration bersifat forward-only. Jangan mengubah migration yang sudah diterapkan; buat migration baru untuk perubahan schema atau policy. Panduan lengkap tersedia di [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

### Membuat admin

Role admin hanya berasal dari `app_metadata`. Jalankan query berikut menggunakan UUID pengguna yang sudah diverifikasi:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'admin')
where id = '<verified-user-uuid>'::uuid;
```

Pengguna harus keluar lalu masuk kembali agar JWT diperbarui. Jangan memakai `user_metadata` untuk authorization.

## Pemeriksaan kualitas

```bash
npm run lint
npm run typecheck
npm run build
npm audit
```

Jalankan juga Security dan Performance Advisors di Supabase setelah setiap perubahan database. Detail model keamanan dan risiko dependency yang masih dipantau ada di [SECURITY.md](SECURITY.md).

## Deployment

Metode utama adalah repository GitHub private yang diimpor melalui integrasi GitHub di Vercel.

1. Push branch `main` ke repository private.
2. Import repository di Vercel.
3. Isi tiga environment variable untuk Preview dan Production.
4. Jalankan preview deployment dan uji halaman publik, login, dashboard, serta redirect proteksi.
5. Deploy production hanya setelah lint, typecheck, build, dan preview berhasil.
6. Masukkan URL production yang tepat ke Supabase Auth URL Configuration.

Perintah CLI alternatif dan checklist domain tersedia di [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Troubleshooting

- **Supabase belum dikonfigurasi:** pastikan nama variable tepat, URL memakai `https://*.supabase.co`, dan key diawali `sb_publishable_`.
- **Auth kembali ke URL yang salah:** samakan `NEXT_PUBLIC_SITE_URL`, Supabase Site URL, dan daftar Redirect URLs; jangan gunakan wildcard production yang luas.
- **Admin masih ditolak:** periksa `raw_app_meta_data.role`, lalu logout/login untuk menyegarkan JWT.
- **Cover tidak muncul:** pastikan file berada di bucket `covers`, URL berasal dari project Supabase yang sama, format didukung, dan ukurannya maksimal 5 MB.
- **Build gagal di PowerShell:** gunakan `npm.cmd` bila execution policy memblokir shim `npm.ps1`.
- **RLS menolak operasi:** periksa policy dan role pengguna. Jangan menonaktifkan RLS atau membuka policy hanya untuk melewati error.

## Kontribusi dan keamanan

Ikuti [AGENTS.md](AGENTS.md) untuk aturan engineering proyek. Laporkan temuan keamanan secara privat sesuai [SECURITY.md](SECURITY.md), bukan melalui issue publik yang memuat detail eksploitasi atau kredensial.
