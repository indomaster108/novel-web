"use client";

import { useActionState, useEffect, useState } from "react";
import { saveProgressAction, type ReaderActionState } from "@/app/actions/reader";

export function ProgressTracker({ novelId, chapterId, initialProgress, enabled, authenticated }: { novelId: string; chapterId: string; initialProgress: number; enabled: boolean; authenticated: boolean }) {
  const [progress, setProgress] = useState(initialProgress);
  const [state, action, pending] = useActionState<ReaderActionState, FormData>(saveProgressAction, { status: "idle", message: "" });

  useEffect(() => {
    function updateProgress() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const next = scrollable <= 0 ? 100 : Math.round((window.scrollY / scrollable) * 100);
      setProgress(Math.min(100, Math.max(initialProgress, next)));
    }
    const frame = window.requestAnimationFrame(updateProgress);
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
    };
  }, [initialProgress]);

  return <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur"><div className="h-1 bg-[var(--border)]"><div className="h-full bg-[var(--accent)] transition-[width]" style={{ width: `${progress}%` }} /></div><div className="mx-auto flex min-h-12 max-w-3xl items-center justify-between gap-3 px-4 text-xs sm:px-6"><span>{progress}% dibaca</span>{enabled && authenticated ? <form action={action} className="flex items-center gap-3"><input type="hidden" name="novelId" value={novelId} /><input type="hidden" name="chapterId" value={chapterId} /><input type="hidden" name="progressPercent" value={progress} /><span role="status" className="hidden text-[var(--muted)] sm:inline">{state.message}</span><button type="submit" disabled={pending} className="rounded-full px-3 py-1.5 font-bold text-[var(--accent)] hover:bg-[var(--background)] disabled:opacity-50">{pending ? "Menyimpan…" : "Simpan progres"}</button></form> : <a href="/auth/login?notice=login-required" className="font-bold text-[var(--accent)]">Masuk untuk menyimpan</a>}</div></div>;
}
