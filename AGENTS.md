# AGENTS.md

Aturan ini berlaku untuk seluruh perubahan di repository.

- Gunakan Next.js App Router dan Server Components sebagai default. Tambahkan Client Component hanya untuk interaksi browser yang memang memerlukannya.
- Pertahankan TypeScript strict, desain mobile-first, dark mode, HTML semantik, aksesibilitas dasar, dan `next/image` untuk cover.
- Jangan menonaktifkan atau melemahkan RLS untuk mengatasi error. Data pribadi harus selalu dibatasi dengan `auth.uid()` dan admin hanya dari `app_metadata`.
- Semua operasi admin wajib diperiksa di server; menyembunyikan tombol di browser bukan authorization.
- Jangan mengekspos secret, `service_role`, atau nilai `.env.local`. Browser hanya boleh menerima Supabase publishable key.
- Jangan mengubah atau menghapus migration yang sudah diterapkan. Buat migration forward-only baru untuk setiap perubahan schema, grant, policy, trigger, atau Storage.
- Validasi input di server, batasi panjang payload, dan hindari raw HTML. Redirect harus memakai allowlist internal.
- Jangan cache secara publik profil, bookmark, progres, draft, session, atau data admin. Revalidate konten publik setelah publish/unpublish.
- Jangan menambah atau meng-upgrade dependency tanpa alasan dan pemeriksaan advisory. Hindari `npm audit fix --force`.
- Sebelum commit atau release, jalankan `npm run lint`, `npm run typecheck`, `npm run build`, cek `npm audit`, dan jalankan Supabase Advisors bila database berubah.
- Jaga commit tetap terfokus, jangan memasukkan `.env.local`, `.vercel`, output build, atau kredensial.
