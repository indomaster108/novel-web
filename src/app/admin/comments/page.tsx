import type { Metadata } from "next";
import Link from "next/link";
import { CommentModerationForm } from "@/components/admin/content-forms";
import { getAdminComments } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Moderasi komentar", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCommentsPage() {
  const { comments, error } = await getAdminComments();
  const pendingCount = comments.filter((comment) => comment.status === "pending").length;
  return <section className="page-shell max-w-4xl py-8 sm:py-12"><Link href="/admin" className="inline-flex min-h-10 items-center text-sm font-extrabold text-[var(--accent)] hover:underline"><span aria-hidden="true" className="mr-2">←</span>Dashboard admin</Link><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><p className="section-eyebrow">Ruang tanggapan</p><h1 className="mt-2 font-[family-name:var(--font-lora)] text-4xl font-bold tracking-tight sm:text-5xl">Moderasi komentar</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Setiap komentar baru perlu disetujui sebelum tampil di halaman baca.</p></div><span className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-sm font-extrabold text-[var(--accent)]">{pendingCount} menunggu</span></div>{error && <p role="status" className="mt-5 rounded-xl bg-red-500/10 p-4 text-sm text-[var(--danger)]">{error}</p>}{comments.length ? <div className="mt-8 space-y-4">{comments.map((comment) => <article key={comment.id} className="ui-card p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm font-extrabold text-[var(--accent)]">{comment.novelTitle} <span aria-hidden="true">·</span> {comment.chapterTitle}</p><p className="mt-1 text-xs text-[var(--muted)]">Status: {comment.status} <span aria-hidden="true">·</span> {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(comment.createdAt))}</p></div><CommentModerationForm id={comment.id} status={comment.status} /></div><p className="mt-4 whitespace-pre-wrap leading-7">{comment.body}</p></article>)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center"><p className="font-[family-name:var(--font-lora)] text-xl font-bold">Belum ada komentar untuk ditinjau.</p><p className="mt-2 text-sm text-[var(--muted)]">Komentar baru akan muncul di sini sebelum ditampilkan ke publik.</p></div>}</section>;
}
