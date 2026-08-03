"use client";

import { useActionState } from "react";
import { uploadCoverAction, type UploadState } from "@/app/admin/actions";

export function CoverUploadForm() {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadCoverAction, { status: "idle", message: "" });
  return <form action={action} className="mt-6 space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><div><label htmlFor="cover" className="text-sm font-bold">File cover</label><input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required disabled={pending} className="mt-2 block w-full text-sm" /><p className="mt-2 text-xs text-[var(--muted)]">JPEG, PNG, WebP, atau AVIF; maksimal 5 MB.</p></div>{state.message && <p role="status" className="text-sm">{state.message}</p>}{state.url && <output className="block break-all rounded-lg bg-[var(--background)] p-3 text-xs">{state.url}</output>}<button type="submit" disabled={pending} className="min-h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-white disabled:opacity-50">{pending ? "Mengunggah…" : "Unggah cover"}</button></form>;
}
