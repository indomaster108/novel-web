"use client";

import { useActionState } from "react";
import { addCommentAction, type ReaderActionState } from "@/app/actions/reader";

export function CommentForm({ chapterId, novelSlug, chapterSlug, enabled, authenticated }: { chapterId: string; novelSlug: string; chapterSlug: string; enabled: boolean; authenticated: boolean }) {
  const [state, action, pending] = useActionState<ReaderActionState, FormData>(addCommentAction, { status: "idle", message: "" });
  if (!enabled) return <p className="rounded-xl bg-amber-500/10 p-4 text-sm">Komentar aktif setelah Supabase dikonfigurasi.</p>;
  if (!authenticated) return <p className="text-sm text-[var(--muted)]"><a href="/auth/login?notice=login-required" className="font-bold text-[var(--accent)]">Masuk</a> untuk menulis komentar.</p>;
  return <form action={action} className="space-y-3"><input type="hidden" name="chapterId" value={chapterId} /><input type="hidden" name="novelSlug" value={novelSlug} /><input type="hidden" name="chapterSlug" value={chapterSlug} /><label htmlFor="comment-body" className="text-sm font-bold">Tulis komentar</label><textarea id="comment-body" name="body" required minLength={1} maxLength={2000} rows={4} disabled={pending} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" /><div className="flex items-center justify-between gap-3"><p className="text-xs text-[var(--muted)]" role="status">{state.message}</p><button type="submit" disabled={pending} className="min-h-10 rounded-full bg-[var(--accent)] px-4 text-sm font-bold text-white disabled:opacity-50">{pending ? "Mengirim…" : "Kirim komentar"}</button></div></form>;
}
