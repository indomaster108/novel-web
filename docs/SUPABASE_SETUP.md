# Supabase setup

Dokumen ini menjelaskan konfigurasi Supabase untuk Ruang Aksara tanpa menyimpan key asli di repository.

## 1. Environment lokal

Salin `.env.example` menjadi `.env.local`, lalu isi:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Gunakan publishable key (`sb_publishable_...`), bukan secret key atau `service_role`. `.env.local` sudah diabaikan Git.

## 2. Migration

Gunakan Supabase CLI terbaru yang didukung project:

```text
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase migration list
npx supabase db push
```

Migration di `supabase/migrations` membuat tabel, constraint, index, trigger, grants, RLS policy, serta bucket `covers`. Jangan mengubah migration yang sudah dipakai; buat migration baru untuk perubahan schema atau policy.

Migration ini bersifat forward-only. Sebelum menerapkannya pada project berisi data, buat backup dan uji pada branch Supabase. Jika gagal, buat migration perbaikan baru; jangan menghapus history migration.

## 3. Auth URL dan template email

Pada **Authentication → URL Configuration**, gunakan URL yang benar-benar tersedia.

Untuk production, buka **Authentication → URL Configuration**:

```text
Site URL: https://novel-web-fawn.vercel.app
Redirect URL: https://novel-web-fawn.vercel.app
```

Untuk development, tambahkan `http://localhost:3000`. Jangan memakai wildcard production yang luas.

### Confirm signup

Buka **Authentication → Email Templates → Confirm signup**. Gunakan kode OTP, bukan tautan verifikasi mentah. Contoh subject:

```text
Kode verifikasi Ruang Aksara
```

Contoh body:

```html
<h2>Konfirmasi akun pembaca</h2>
<p>Masukkan kode berikut di Ruang Aksara:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:8px">{{ .Token }}</p>
<p>Kode ini hanya dapat digunakan sekali. Abaikan email ini jika Anda tidak membuat akun.</p>
```

Pembaca memasukkan email dan kode tersebut pada `/auth/verify`. Email dan OTP tidak dikirim melalui query string atau disimpan di URL.

### Reset password

Buka **Authentication → Email Templates → Reset password** dan gunakan:

```html
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">
  Atur ulang kata sandi
</a>
```

Jangan memakai `{{ .ConfirmationURL }}` untuk reset password. Route `/auth/confirm` tetap digunakan untuk pemulihan kata sandi dan kompatibilitas tautan konfirmasi lama. Verifikasi pendaftaran baru menggunakan `{{ .Token }}` dan aksi server `/auth/verify`; setelah berhasil, aplikasi membuat sesi lalu mengarahkan pembaca ke dashboard.

Aktifkan konfirmasi email. Untuk pengiriman production, gunakan SMTP milik organisasi dan tinjau rate limit serta attack protection di Supabase Auth. Setelah mengganti template, buat akun pembaca percobaan dan pastikan email benar-benar berisi kode 6 digit.

## 4. Membuat admin

Tidak ada pendaftaran admin publik. Buat atau undang akun khusus melalui **Authentication → Users**, lalu tetapkan role admin. Role hanya berasal dari `auth.users.raw_app_meta_data`, yang diterbitkan sebagai `app_metadata` pada JWT. Jalankan dengan UUID pengguna yang sudah diverifikasi:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'admin')
where id = '<verified-user-uuid>'::uuid;
```

Keluar dan masuk kembali setelah perubahan agar JWT diperbarui. Jangan menyimpan role authorization di `raw_user_meta_data`/`user_metadata`.

## 5. Model akses

- `anon`: hanya novel dan bab berstatus `published`, serta komentar `approved` yang novel dan bab induknya juga masih `published`.
- `authenticated`: akses publik ditambah profil, bookmark, progres, dan komentar miliknya.
- `admin`: pengelolaan novel/bab, moderasi komentar, dan mutasi Storage berdasarkan `app_metadata.role = admin`.
- Bucket `covers`: public read; upload/update/delete hanya admin; maksimum 5 MB; JPEG, PNG, WebP, atau AVIF.

RLS aktif pada seluruh tabel `public`. `anon` dan `authenticated` hanya mendapat grant yang diperlukan agar Data API dapat digunakan; policy tetap menentukan row yang dapat diakses.

## 6. Verifikasi

Setelah migration, jalankan Security dan Performance Advisors. Uji minimal:

1. Anon tidak dapat membaca novel/bab draft.
2. User biasa tidak dapat menulis novel, mengubah status komentar, atau mengunggah cover.
3. User A tidak dapat membaca/mengubah bookmark dan progres User B.
4. Komentar baru selalu `pending` dan tidak dapat disetujui pemiliknya.
5. Admin dapat membaca draft dan melakukan mutasi yang diizinkan.

Jangan memperbaiki kegagalan pengujian dengan menonaktifkan RLS, memakai `using (true)` pada data pribadi, atau memasang `service_role` di frontend.
