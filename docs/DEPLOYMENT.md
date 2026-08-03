# Deployment dan custom domain

## GitHub private

Pastikan `.env.local` diabaikan, lalu buat repository private:

```bash
git init
git branch -M main
git add .
git commit -m "chore: audit and prepare production release"
gh auth login
gh repo create novel-web --private --source=. --remote=origin --push
```

Jangan mengubah visibility menjadi public tanpa persetujuan pemilik.

## Vercel

Integrasi GitHub adalah jalur utama: import repository private di Vercel, pilih framework Next.js, lalu isi variable berikut pada Preview dan Production:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

Jangan memasukkan secret key Supabase. Jalur CLI alternatif:

```bash
npx vercel login
npx vercel link
npx vercel
npx vercel --prod
```

Preview harus diuji sebelum production. Verifikasi homepage, katalog, detail novel, auth callback, redirect `/dashboard`, redirect `/admin`, security headers, dan respons 404. Jangan menganggap deployment berhasil hanya dari status CLI; buka URL final melalui HTTPS.

## Supabase Auth production

Setelah origin production benar-benar tersedia, masukkan origin exact pada **Authentication > URL Configuration**:

```text
Site URL: https://<production-origin>
Redirect URL: https://<production-origin>/auth/callback
Redirect URL: https://<production-origin>/auth/update-password
```

Tambahkan preview tertentu hanya ketika memang diperlukan untuk pengujian auth dan hapus setelah selesai. Hindari wildcard production yang luas.

## Custom domain

Alur yang direkomendasikan:

```text
Registrar -> Cloudflare DNS -> Vercel
```

1. Tambahkan domain ke project Vercel dan catat record DNS yang diberikan Vercel; jangan mengarang A/CNAME.
2. Buat record tersebut di Cloudflare dengan mode **DNS only** selama validasi dan operasi normal, kecuali proxy Cloudflare memang sudah dirancang dan diuji.
3. Tunggu Vercel menyatakan konfigurasi valid dan sertifikat HTTPS aktif.
4. Tetapkan satu canonical domain dan redirect permanen varian `www` atau non-`www` ke domain tersebut.
5. Ubah `NEXT_PUBLIC_SITE_URL` menjadi canonical HTTPS origin.
6. Ubah Supabase Site URL dan dua Redirect URLs ke canonical origin yang sama.
7. Redeploy, lalu verifikasi HTTPS, callback login/reset password, metadata canonical, sitemap, robots, dan redirect domain.

Jika domain belum tersedia, biarkan domain Vercel sebagai canonical sementara dan jangan menambahkan nama domain contoh ke konfigurasi production.
