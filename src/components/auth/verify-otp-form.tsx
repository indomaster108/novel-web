"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  resendConfirmationAction,
  verifyEmailOtpAction,
  type AuthState,
} from "@/app/auth/actions";

const initialState: AuthState = { status: "idle", message: "" };

export function VerifyOtpForm({ configured }: { configured: boolean }) {
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyEmailOtpAction,
    initialState,
  );
  const [resendState, resendAction, resending] = useActionState(
    resendConfirmationAction,
    initialState,
  );

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-14 lg:py-20">
      <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] lg:grid lg:grid-cols-[minmax(0,.86fr)_minmax(420px,1fr)]">
        <aside className="relative hidden overflow-hidden bg-[var(--accent)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 size-72 rounded-full border border-white/15" />
          <div className="absolute -bottom-28 -left-20 size-80 rounded-full border border-white/10" />
          <div className="relative">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/12 font-[family-name:var(--font-lora)] font-bold">RA</span>
            <p className="mt-10 max-w-sm font-[family-name:var(--font-lora)] text-4xl font-bold leading-tight">Satu langkah lagi.</p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/75">Konfirmasi emailmu agar bookmark dan progres membaca tersimpan aman di akunmu.</p>
          </div>
          <div className="relative rounded-2xl border border-white/15 bg-white/8 p-5">
            <p className="text-xs font-extrabold tracking-[0.14em] text-white/60 uppercase">Kode keamanan</p>
            <p className="mt-2 text-sm leading-6 text-white/85">Kode hanya berlaku sementara dan hanya dapat digunakan satu kali. Jangan berikan kode kepada siapa pun.</p>
          </div>
        </aside>

        <div className="p-5 sm:p-9 lg:p-12">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Link href="/" className="flex min-h-11 items-center gap-2 font-[family-name:var(--font-lora)] font-bold">
              <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent)] text-xs text-white">RA</span>
              Ruang Aksara
            </Link>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--accent)]">Verifikasi</span>
          </div>

          <div className="mt-8 lg:mt-0">
            <p className="text-xs font-extrabold tracking-[0.16em] text-[var(--accent)] uppercase">Verifikasi pembaca</p>
            <h1 className="mt-3 font-[family-name:var(--font-lora)] text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Masukkan kode dari email.</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)] sm:text-base">Gunakan alamat email yang dipakai saat mendaftar dan kode 6 digit dari email terbaru.</p>
          </div>

          {!configured && (
            <p className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm" role="status">
              Mode development: konfigurasi Supabase belum tersedia.
            </p>
          )}

          <form className="mt-7 space-y-5" action={verifyAction}>
            <div>
              <label htmlFor="verify-email" className="text-sm font-extrabold">Alamat email</label>
              <input id="verify-email" name="email" type="email" autoComplete="email" maxLength={254} className="auth-input" required disabled={!configured || verifying} placeholder="nama@email.com" />
            </div>
            <div>
              <label htmlFor="verification-code" className="text-sm font-extrabold">Kode verifikasi</label>
              <input
                id="verification-code"
                name="token"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                className="auth-input text-center font-mono text-xl font-bold tracking-[0.42em] tabular-nums sm:text-2xl"
                required
                disabled={!configured || verifying}
                aria-describedby="verification-code-hint"
                placeholder="000000"
              />
              <p id="verification-code-hint" className="mt-1.5 text-xs leading-5 text-[var(--muted)]">Kode berisi tepat 6 angka dan hanya dapat dipakai sekali.</p>
            </div>

            {verifyState.message && (
              <p className="rounded-xl bg-red-500/10 p-3.5 text-sm leading-6 text-[var(--danger)]" role="alert">
                {verifyState.message}
              </p>
            )}

            <button type="submit" disabled={!configured || verifying} className="min-h-12 w-full rounded-xl bg-[var(--accent)] px-5 text-sm font-extrabold text-white shadow-[0_10px_30px_color-mix(in_srgb,var(--accent)_22%,transparent)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50">
              {verifying ? "Memeriksa kode…" : "Verifikasi dan masuk"}
            </button>
          </form>

          <div className="mt-7 rounded-2xl bg-[var(--surface-2)] p-4 sm:p-5">
            <p className="text-sm font-extrabold">Kode belum masuk atau kedaluwarsa?</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Masukkan emailmu untuk meminta kode baru. Demi keamanan, hasilnya tetap dibuat umum.</p>
            <form action={resendAction} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label htmlFor="otp-resend-email" className="sr-only">Email untuk kirim ulang kode</label>
              <input id="otp-resend-email" name="email" type="email" autoComplete="email" maxLength={254} className="auth-input !mt-0" required disabled={!configured || resending} placeholder="nama@email.com" />
              <button type="submit" disabled={!configured || resending} className="min-h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-extrabold text-[var(--accent)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50">
                {resending ? "Mengirim…" : "Kirim kode baru"}
              </button>
            </form>
            {resendState.message && (
              <p className={`mt-3 rounded-xl p-3 text-sm leading-6 ${resendState.status === "error" ? "bg-red-500/10 text-[var(--danger)]" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`} role="status">
                {resendState.message}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--border)] pt-6 text-sm font-bold text-[var(--accent)]">
            <Link href="/auth/login">Kembali masuk</Link>
            <Link href="/auth/register">Daftar pembaca</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
