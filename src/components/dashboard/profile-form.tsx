"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileActionState } from "@/app/dashboard/actions";

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(updateProfileAction, { status: "idle", message: "" });
  return <form action={action} className="mt-5 space-y-3">
    <div>
      <label htmlFor="displayName" className="text-sm font-bold">Nama tampilan</label>
      <input id="displayName" name="displayName" defaultValue={displayName} required maxLength={80} disabled={pending} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]" />
    </div>
    {state.message && <p role="status" className={state.status === "error" ? "text-sm text-red-700" : "text-sm text-emerald-700"}>{state.message}</p>}
    <button type="submit" disabled={pending} className="min-h-11 rounded-full border border-[var(--accent)] px-4 text-sm font-bold text-[var(--accent)] disabled:opacity-50">{pending ? "Menyimpan…" : "Simpan profil"}</button>
  </form>;
}
