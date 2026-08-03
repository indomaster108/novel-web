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

const copy: Record<FormMode, { eyebrow: string; title: string; description: string; submit: string }> = {
  login: {
    eyebrow: "Akses pembaca & admin",
    title: "Selamat datang kembali.",
    description: "Gunakan akunmu untuk kembali ke bacaan atau membuka ruang pengelolaan.",
    submit: "Masuk dengan aman",
  },
  register: {
    eyebrow: "Pendaftaran pembaca",
    title: "Buat ruang bacamu.",
    description: "Akun baru selalu dibuat sebagai pembaca. Akun admin disiapkan terpisah oleh pemilik situs.",
    submit: "Buat akun pembaca",
  },
  forgot: {
    eyebrow: "Pemulihan akun",
    title: "Pulihkan aksesmu.",
    description: "Kami akan mengirim tautan pemulihan jika email terdaftar di Ruang Aksara.",
    submit: "Kirim tautan pemulihan",
  },
};

const initialState: AuthState = { status: "idle", message: "" };

export function AuthForm({ mode, configured, notice }: { mode: FormMode; configured: boolean; notice?: string }) {
  const action = mode === "login" ? loginAction : mode === "register" ? registerAction : forgotPasswordAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const text = copy[mode];
  const isForgot = mode === "forgot";

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-14 lg:py-20">
      <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] lg:grid lg:grid-cols-[minmax(0,.86fr)_minmax(420px,1fr)]">
        <aside className="relative hidden overflow-hidden bg-[var(--accent)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 size-72 rounded-full border border-white/15" />
          <div className="absolute -bottom-28 -left-20 size-80 rounded-full border border-white/10" />
          <div className="relative">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/12 font-[family-name:var(--font-lora)] font-bold">RA</span>
            <p className="mt-10 max-w-sm font-[family-name:var(--font-lora)] text-4xl font-bold leading-tight">Cerita yang menunggumu pulang.</p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/75">Simpan novel, lanjutkan bab terakhir, dan nikmati tampilan membaca yang bisa disesuaikan.</p>
          </div>
          <ul className="relative mt-12 space-y-4 text-sm font-semibold text-white/85">
            <li className="flex items-center gap-3"><CheckIcon /> Progres bacaan tersimpan privat</li>
            <li className="flex items-center gap-3"><CheckIcon /> Tema membaca yang nyaman</li>
            <li className="flex items-center gap-3"><CheckIcon /> Akses admin terpisah dan terlindungi</li>
          </ul>
        </aside>

        <div className="p-5 sm:p-9 lg:p-12">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Link href="/" className="flex min-h-11 items-center gap-2 font-[family-name:var(--font-lora)] font-bold">
              <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent)] text-xs text-white">RA</span>
              Ruang Aksara
            </Link>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--accent)]">{mode === "register" ? "Pembaca" : "Akun"}</span>
          </div>

          <div className="mt-8 lg:mt-0">
            <p className="text-xs font-extrabold tracking-[0.16em] text-[var(--accent)] uppercase">{text.eyebrow}</p>
            <h1 className="mt-3 font-[family-name:var(--font-lora)] text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{text.title}</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)] sm:text-base">{text.description}</p>
          </div>

          {!configured && (
            <p className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm" role="status">
              Mode development: konfigurasi Supabase belum tersedia.
            </p>
          )}
          {notice === "login-required" && (
            <p className="mt-6 rounded-xl bg-[var(--accent-soft)] p-3 text-sm text-[var(--accent)]" role="status">
              Masuk terlebih dahulu untuk membuka halaman tersebut.
            </p>
          )}

          <form className="mt-7 space-y-5" action={formAction}>
            {mode === "register" && (
              <Field label="Nama tampilan" id="display-name">
                <input id="display-name" name="displayName" autoComplete="name" maxLength={80} className="auth-input" required disabled={!configured || pending} placeholder="Nama yang tampil di profil" />
              </Field>
            )}
            <Field label="Alamat email" id="email">
              <input id="email" name="email" type="email" autoComplete="email" maxLength={254} className="auth-input" required disabled={!configured || pending} placeholder="nama@email.com" />
            </Field>
            {!isForgot && (
              <Field label="Kata sandi" id="password" hint="Minimal 8 karakter.">
                <input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} maxLength={128} className="auth-input" required disabled={!configured || pending} placeholder="Masukkan kata sandi" />
              </Field>
            )}

            {state.message && (
              <div className={`rounded-xl p-3.5 text-sm leading-6 ${state.status === "error" ? "bg-red-500/10 text-[var(--danger)]" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`} role="status">
                <p>{state.message}</p>
                {mode === "register" && state.status === "success" && (
                  <Link href="/auth/verify" className="mt-2 inline-flex min-h-10 items-center font-extrabold underline underline-offset-4">
                    Masukkan kode verifikasi
                  </Link>
                )}
              </div>
            )}

            <button type="submit" disabled={!configured || pending} className="min-h-12 w-full rounded-xl bg-[var(--accent)] px-5 text-sm font-extrabold text-white shadow-[0_10px_30px_color-mix(in_srgb,var(--accent)_22%,transparent)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50">
              {pending ? "Sedang memproses…" : text.submit}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-x-5 gap-y-2 font-bold text-[var(--accent)]">
              {mode !== "login" && <Link href="/auth/login">Sudah punya akun?</Link>}
              {mode !== "register" && <Link href="/auth/register">Daftar sebagai pembaca</Link>}
              {!isForgot && <Link href="/auth/forgot-password">Lupa kata sandi?</Link>}
              {(mode === "login" || mode === "register") && <Link href="/auth/verify">Sudah punya kode?</Link>}
            </div>
          </div>

          {mode === "login" && (
            <p className="mt-5 rounded-xl bg-[var(--surface-2)] p-3.5 text-xs leading-5 text-[var(--muted)]">
              <strong className="text-[var(--foreground)]">Khusus admin:</strong> tidak ada pendaftaran admin publik. Masuk dengan akun admin yang telah ditetapkan pemilik situs; sistem akan mengarahkanmu otomatis ke dashboard admin.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, id, hint, children }: { label: string; id: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-extrabold">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

function CheckIcon() {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/12" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current" strokeWidth="2.2"><path d="m5 12 4 4L19 6" /></svg>
    </span>
  );
}
