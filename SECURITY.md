# Security policy

## Model akses

Ruang Aksara memakai defense in depth: validasi Zod dan authorization server-side di aplikasi, ditambah PostgreSQL Row Level Security sebagai batas otorisasi utama.

- `anon` hanya dapat membaca novel dan bab published, serta komentar approved yang induk novel dan babnya masih published.
- `authenticated` memperoleh akses publik serta hanya dapat mengakses profil, bookmark, progres, dan komentar miliknya sendiri.
- `admin` ditentukan dari `auth.jwt() -> 'app_metadata' ->> 'role'`; seluruh operasi admin diperiksa lagi di server dan tetap dibatasi RLS.
- Bucket `covers` dapat dibaca publik. Upload, update, dan delete hanya untuk admin, maksimum 5 MB, dengan format JPEG, PNG, WebP, atau AVIF.

Tidak ada `service_role` di aplikasi browser, policy data pribadi dengan `using (true)`, atau authorization berbasis `user_metadata`.

## Perlindungan aplikasi

- Redirect autentikasi dibatasi ke tujuan internal yang telah diizinkan.
- React escaping digunakan untuk konten; aplikasi tidak memakai `dangerouslySetInnerHTML`.
- Upload cover diperiksa berdasarkan ukuran, MIME, magic bytes, nama acak, dan origin bucket yang sama.
- Halaman pengguna, draft, dan admin bersifat dinamis dan tidak memakai public cache.
- Header CSP, HSTS pada production, anti-framing, MIME sniffing protection, referrer policy, dan permissions policy dikirim pada seluruh route.
- Secret tidak boleh disimpan pada source code, log, issue, atau hasil build.

## Environment variables dan rotasi

`.env.local`, `.env`, `.env.*.local`, dan `.vercel` diabaikan Git. Repository hanya menyimpan `.env.example` tanpa nilai.

Jika key diduga bocor:

1. Cabut atau rotasi key di Supabase.
2. Perbarui environment Vercel pada scope Preview dan Production yang relevan.
3. Redeploy aplikasi.
4. Logout sesi yang berisiko atau cabut session/token bila diperlukan.
5. Periksa log Supabase dan Vercel, lalu dokumentasikan dampak dan waktu pemulihan secara privat.

Jangan pernah menambahkan secret key atau `service_role` ke variable berawalan `NEXT_PUBLIC_`.

## Checklist production

- Lint, typecheck, build, dan smoke test preview berhasil.
- Seluruh tabel public memiliki RLS dan explicit grants minimum.
- Security Advisor Supabase tidak memiliki temuan terbuka.
- Site URL dan Redirect URLs memakai origin production yang tepat tanpa wildcard luas.
- Email confirmation, SMTP organisasi, rate limit, dan Auth attack protection telah ditinjau.
- Akun admin memakai MFA dan jumlahnya dibatasi.
- Bucket Storage tetap membatasi tipe dan ukuran file.
- `.env.local` tidak ter-track dan tidak ada secret pada history Git.
- Dependency advisory sudah ditinjau berdasarkan reachability sebelum release.
- Backup dan prosedur rollback migration/deployment tersedia.

## Risiko yang masih dipantau

- Next.js 16.2.12 belum memperbarui dependency PostCSS dan Sharp yang terdampak advisory. Repository sementara memaksa PostCSS 8.5.25 dan Sharp 0.35.3 yang sudah patched; quality gate dan image optimizer wajib diuji setiap install. Ganti override dengan versi resmi Next.js segera setelah perbaikan upstream tersedia. Jangan memakai `npm audit fix --force` yang menurunkan Next.js ke versi usang.
- Belum ada audit-log aplikasi khusus untuk mutasi admin.
- Rate limiting aplikasi untuk komentar dan upload belum terpisah dari kontrol Supabase/Vercel. Tambahkan WAF/rate limit sebelum trafik publik yang tinggi.
- Perubahan `app_metadata` dapat menunggu refresh JWT; gunakan logout/login dan cabut sesi bila akses admin dicabut secara mendesak.

## Melaporkan masalah

Jangan membuka issue publik yang memuat detail eksploitasi, data pengguna, token, atau kredensial. Hubungi pemilik repository melalui kanal privat organisasi dengan:

- ringkasan dan dampak,
- langkah reproduksi minimal,
- route/tabel/policy yang terdampak,
- bukti yang sudah disamarkan,
- saran mitigasi bila ada.

Jangan menguji menggunakan data pengguna nyata atau melakukan akses di luar akun dan resource yang Anda miliki izin untuk uji.
