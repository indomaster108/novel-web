"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileActionState } from "@/app/dashboard/actions";

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(
    updateProfileAction,
    { status: "idle", message: "" },
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="displayName" className="text-sm font-extrabold">Nama tampilan</label>
        <input id="displayName" name="displayName" defaultValue={displayName} required maxLength={80} disabled={pending} className="auth-input text-sm" />
      </div>
      {state.message && <p role="status" className={state.status === "error" ? "text-sm text-[var(--danger)]" : "text-sm text-emerald-700 dark:text-emerald-300"}>{state.message}</p>}
      <button type="submit" disabled={pending} className="min-h-11 w-full rounded-xl border border-[var(--accent)] px-4 text-sm font-extrabold text-[var(--accent)] transition hover:bg-[var(--accent-soft)] disabled:opacity-50">
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </button>
    </form>
  );
}
