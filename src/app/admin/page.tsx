import type { Metadata } from "next";
import Link from "next/link";
import { getAdminOverview } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const overview = await getAdminOverview();
  const stats = [
    ["Novel", overview.novelCount],
    ["Bab", overview.chapterCount],
    ["Novel draft", overview.draftCount],
    ["Novel terbit", overview.publishedCount],
    ["Komentar pending", overview.pendingCommentCount],
  ];
  return <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"><p className="text-sm font-bold text-[var(--accent)]">Admin</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-[family-name:var(--font-lora)] text-4xl font-bold">Pusat pengelolaan konten</h1><p className="mt-3 max-w-2xl text-[var(--muted)]">Semua perubahan diperiksa ulang oleh Server Action dan RLS sebelum disimpan.</p></div><Link href="/admin/novels/new" className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-white">Buat novel</Link></div>{overview.error && <p role="status" className="mt-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-800">{overview.error}</p>}<div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{stats.map(([label, value]) => <article key={label as string} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-2 font-[family-name:var(--font-lora)] text-3xl font-bold">{value}</p></article>)}</div><div className="mt-10 grid gap-4 sm:grid-cols-2"><Link href="/admin/novels" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:border-[var(--accent)]"><h2 className="font-[family-name:var(--font-lora)] text-2xl font-bold">Kelola novel & bab</h2><p className="mt-2 text-sm text-[var(--muted)]">Buat, edit, terbitkan, atau hapus novel dan bab.</p></Link><Link href="/admin/comments" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:border-[var(--accent)]"><h2 className="font-[family-name:var(--font-lora)] text-2xl font-bold">Moderasi komentar</h2><p className="mt-2 text-sm text-[var(--muted)]">Tinjau komentar pending dan putuskan statusnya.</p></Link></div></section>;
}
