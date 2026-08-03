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

Buka **Authentication → Email Templates → Confirm signup**. Ganti tautan tombol agar verifikasi diproses oleh aplikasi, bukan menampilkan respons JSON Supabase:

```html
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Konfirmasi akun pembaca
</a>
```

### Reset password

Buka **Authentication → Email Templates → Reset password** dan gunakan:

```html
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">
  Atur ulang kata sandi
</a>
```

Jangan memakai `{{ .ConfirmationURL }}` untuk kedua tombol di atas. Route `/auth/confirm` memverifikasi token sekali pakai di server, membuat cookie sesi, lalu mengarahkan pembaca ke dashboard, admin ke area admin, atau pemulihan ke halaman kata sandi. Tautan kedaluwarsa diarahkan ke halaman ramah pengguna dengan formulir kirim ulang.

Aktifkan konfirmasi email. Untuk pengiriman production, konfigurasi SMTP milik organisasi dan tinjau rate limit serta attack protection di Supabase Auth.

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
