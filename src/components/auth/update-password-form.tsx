"use client";

import { useActionState } from "react";
import { updatePasswordAction, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = { status: "idle", message: "" };

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialState);
  return <section className="mx-auto max-w-md px-4 py-16"><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8"><p className="text-sm font-bold text-[var(--accent)]">Keamanan akun</p><h1 className="mt-2 font-[family-name:var(--font-lora)] text-3xl font-bold">Buat kata sandi baru</h1><form action={action} className="mt-7 space-y-5"><div><label htmlFor="new-password" className="text-sm font-bold">Kata sandi baru</label><input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={pending} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-transparent px-3" /></div>{state.message && <p role="status" className={`rounded-lg p-3 text-sm ${state.status === "error" ? "bg-red-500/10" : "bg-emerald-500/10"}`}>{state.message}</p>}<button type="submit" disabled={pending} className="min-h-12 w-full rounded-xl bg-[var(--accent)] px-4 font-bold text-white disabled:opacity-50">{pending ? "Menyimpan…" : "Simpan kata sandi"}</button></form></div></section>;
}
