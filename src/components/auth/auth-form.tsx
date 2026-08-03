"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  type AuthState,
} from "@/app/auth/actions";

type FormMode = "login" | "register" | "forgot";

const copy: Record<FormMode, { title: string; description: string; submit: string }> = {
  login: { title: "Selamat datang kembali", description: "Masuk untuk menyimpan bacaanmu.", submit: "Masuk" },
  register: { title: "Mulai membaca", description: "Buat akun untuk menandai dan melanjutkan cerita.", submit: "Buat akun" },
  forgot: { title: "Atur ulang kata sandi", description: "Kami akan mengirim tautan pemulihan ke emailmu.", submit: "Kirim tautan" },
};

const initialState: AuthState = { status: "idle", message: "" };

export function AuthForm({ mode, configured, notice }: { mode: FormMode; configured: boolean; notice?: string }) {
  const action = mode === "login" ? loginAction : mode === "register" ? registerAction : forgotPasswordAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const text = copy[mode];
  const isForgot = mode === "forgot";

  return (
    <section className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold text-[var(--accent)]">Akun Ruang Aksara</p>
        <h1 className="mt-2 font-[family-name:var(--font-lora)] text-3xl font-bold">{text.title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{text.description}</p>
        {!configured && <p className="mt-5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm" role="status">Mode development: isi <code>.env.local</code> berdasarkan <code>.env.example</code> untuk mengaktifkan Auth.</p>}
        {notice === "login-required" && <p className="mt-5 rounded-lg bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] p-3 text-sm" role="status">Masuk terlebih dahulu untuk membuka halaman tersebut.</p>}
        <form className="mt-7 space-y-5" action={formAction}>
          {mode === "register" && <div><label htmlFor="display-name" className="text-sm font-bold">Nama tampilan</label><input id="display-name" name="displayName" autoComplete="name" maxLength={80} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-transparent px-3" required disabled={!configured || pending} /></div>}
          <div><label htmlFor="email" className="text-sm font-bold">Email</label><input id="email" name="email" type="email" autoComplete="email" maxLength={254} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-transparent px-3" required disabled={!configured || pending} /></div>
          {!isForgot && <div><label htmlFor="password" className="text-sm font-bold">Kata sandi</label><input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} maxLength={128} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-transparent px-3" required disabled={!configured || pending} /><p className="mt-1 text-xs text-[var(--muted)]">Minimal 8 karakter.</p></div>}
          {state.message && <p className={`rounded-lg p-3 text-sm ${state.status === "error" ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`} role="status">{state.message}</p>}
          <button type="submit" disabled={!configured || pending} className="min-h-12 w-full rounded-xl bg-[var(--accent)] px-4 font-bold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Memproses…" : text.submit}</button>
        </form>
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-[var(--accent)]">
          {mode !== "login" && <Link href="/auth/login">Sudah punya akun?</Link>}
          {mode !== "register" && <Link href="/auth/register">Buat akun</Link>}
          {!isForgot && <Link href="/auth/forgot-password">Lupa kata sandi?</Link>}
        </div>
      </div>
    </section>
  );
}
