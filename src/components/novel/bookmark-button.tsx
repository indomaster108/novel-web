"use client";

import { useActionState } from "react";
import { toggleBookmarkAction, type ReaderActionState } from "@/app/actions/reader";

export function BookmarkButton({ novelId, initialBookmarked, enabled, authenticated }: { novelId: string; initialBookmarked: boolean; enabled: boolean; authenticated: boolean }) {
  const [state, action, pending] = useActionState<ReaderActionState, FormData>(toggleBookmarkAction, { status: "idle", message: "", bookmarked: initialBookmarked });
  const bookmarked = state.bookmarked ?? initialBookmarked;

  if (!enabled) return <button type="button" disabled className="min-h-12 rounded-full border border-[var(--border)] px-5 text-sm font-bold opacity-55">Supabase belum aktif</button>;
  if (!authenticated) return <a href="/auth/login?notice=login-required" className="inline-flex min-h-12 items-center rounded-full border border-[var(--border)] px-5 text-sm font-bold hover:border-[var(--accent)]">Masuk untuk bookmark</a>;

  return <form action={action}><input type="hidden" name="novelId" value={novelId} /><input type="hidden" name="intent" value={bookmarked ? "remove" : "add"} /><button type="submit" disabled={pending} className="min-h-12 rounded-full border border-[var(--border)] px-5 text-sm font-bold hover:border-[var(--accent)] disabled:opacity-50">{pending ? "Menyimpan…" : bookmarked ? "Hapus bookmark" : "Simpan bookmark"}</button>{state.message && <p className="mt-2 max-w-xs text-xs text-[var(--muted)]" role="status">{state.message}</p>}</form>;
}
