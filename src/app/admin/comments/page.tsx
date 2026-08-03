import type { Metadata } from "next";
import Link from "next/link";
import { CommentModerationForm } from "@/components/admin/content-forms";
import { getAdminComments } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Moderasi komentar", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCommentsPage() {
  const { comments, error } = await getAdminComments();
  return <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16"><Link href="/admin" className="text-sm font-bold text-[var(--accent)] hover:underline">← Dashboard admin</Link><h1 className="mt-3 font-[family-name:var(--font-lora)] text-4xl font-bold">Moderasi komentar</h1><p className="mt-3 text-[var(--muted)]">Komentar baru selalu masuk sebagai pending dan tidak dapat disetujui oleh pembuatnya melalui RLS.</p>{error && <p role="status" className="mt-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-800">{error}</p>}{comments.length ? <div className="mt-8 space-y-4">{comments.map((comment) => <article key={comment.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-bold text-[var(--accent)]">{comment.novelTitle} · {comment.chapterTitle}</p><p className="mt-1 text-xs text-[var(--muted)]">Status: {comment.status} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(comment.createdAt))}</p></div><CommentModerationForm id={comment.id} status={comment.status} /></div><p className="mt-4 whitespace-pre-wrap leading-7">{comment.body}</p></article>)}</div> : <p className="mt-8 rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">Belum ada komentar untuk dimoderasi.</p>}</section>;
}
