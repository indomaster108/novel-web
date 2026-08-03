import type { Metadata } from "next";
import Link from "next/link";
import { ResendConfirmationForm } from "@/components/auth/resend-confirmation-form";
import { getSupabaseConfig } from "@/lib/env";

export const metadata: Metadata = { title: "Autentikasi Bermasalah", robots: { index: false, follow: false } };

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const message = reason === "configuration"
    ? "Supabase belum dikonfigurasi pada environment aplikasi."
    : "Tautan sudah kedaluwarsa, tidak valid, atau telah digunakan.";
  return (
    <section className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-20">
      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow)] sm:p-9">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-500/12 text-amber-700 dark:text-amber-300" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth="1.8"><path d="M12 8v5M12 17h.01" /><path d="M10.3 3.8 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z" /></svg>
        </span>
        <p className="mt-5 text-xs font-extrabold tracking-[0.16em] text-[var(--accent)] uppercase">Verifikasi akun</p>
        <h1 className="mt-2 font-[family-name:var(--font-lora)] text-3xl font-bold">Tautan belum dapat diproses.</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">{message} Tautan email hanya dapat dipakai sekali; gunakan email terbaru bila pernah meminta kirim ulang.</p>
        {reason !== "configuration" && <ResendConfirmationForm configured={Boolean(getSupabaseConfig())} />}
        <Link href="/auth/login" className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-[var(--accent)] hover:underline">Kembali ke halaman masuk</Link>
      </div>
    </section>
  );
}
