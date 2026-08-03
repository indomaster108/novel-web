"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveProgressAction, type ReaderActionState } from "@/app/actions/reader";

export function ProgressTracker({ novelId, chapterId, initialProgress, enabled, authenticated }: { novelId: string; chapterId: string; initialProgress: number; enabled: boolean; authenticated: boolean }) {
  const [progress, setProgress] = useState(initialProgress);
  const frameRef = useRef<number | null>(null);
  const savedProgressRef = useRef(initialProgress);
  const [state, action, pending] = useActionState<ReaderActionState, FormData>(saveProgressAction, { status: "idle", message: "" });

  useEffect(() => {
    savedProgressRef.current = initialProgress;
    function calculateProgress() {
      frameRef.current = null;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const next = scrollable <= 0 ? 100 : Math.round((window.scrollY / scrollable) * 100);
      const boundedProgress = Math.min(100, Math.max(savedProgressRef.current, next));
      setProgress((current) => current === boundedProgress ? current : boundedProgress);
    }
    function onScroll() {
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(calculateProgress);
    }
    calculateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [initialProgress]);

  return <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_94%,transparent)] shadow-[0_-8px_28px_rgb(31_43_36_/_7%)] backdrop-blur-xl"><div className="h-1.5 bg-[var(--surface-2)]"><div className="h-full rounded-r-full bg-[var(--accent)] transition-[width] duration-300" style={{ width: `${progress}%` }} /></div><div className="page-shell flex min-h-14 items-center justify-between gap-3 py-2 text-xs sm:text-sm"><div><span className="font-extrabold text-[var(--accent)] tabular-nums">{progress}%</span><span className="ml-1.5 text-[var(--muted)]">bab ini dibaca</span></div>{enabled && authenticated ? <form action={action} className="flex items-center gap-3"><input type="hidden" name="novelId" value={novelId} /><input type="hidden" name="chapterId" value={chapterId} /><input type="hidden" name="progressPercent" value={progress} /><span role="status" className="hidden max-w-44 truncate text-xs text-[var(--muted)] sm:inline">{state.message}</span><button type="submit" disabled={pending} className="min-h-9 rounded-xl bg-[var(--accent-soft)] px-3 text-xs font-extrabold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white disabled:opacity-50">{pending ? "Menyimpan…" : "Simpan progres"}</button></form> : <a href="/auth/login?notice=login-required" className="min-h-9 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-extrabold text-[var(--accent)]">Masuk untuk simpan</a>}</div></div>;
}
