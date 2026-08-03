"use client";

import { useActionState } from "react";
import { resendConfirmationAction, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = { status: "idle", message: "" };

export function ResendConfirmationForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(resendConfirmationAction, initialState);

  return (
    <form action={action} className="mt-7 text-left">
      <label htmlFor="resend-email" className="text-sm font-extrabold">Email akun pembaca</label>
      <input id="resend-email" name="email" type="email" autoComplete="email" maxLength={254} required disabled={!configured || pending} className="auth-input" placeholder="nama@email.com" />
      {state.message && (
        <p role="status" className={`mt-3 rounded-xl p-3 text-sm leading-6 ${state.status === "error" ? "bg-red-500/10 text-[var(--danger)]" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
          {state.message}
        </p>
      )}
      <button type="submit" disabled={!configured || pending} className="mt-4 min-h-12 w-full rounded-xl bg-[var(--accent)] px-4 text-sm font-extrabold text-white disabled:opacity-50">
        {pending ? "Mengirim…" : "Kirim ulang kode verifikasi"}
      </button>
    </form>
  );
}
