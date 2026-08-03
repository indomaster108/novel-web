import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Autentikasi Bermasalah", robots: { index: false, follow: false } };

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const message = reason === "configuration"
    ? "Supabase belum dikonfigurasi pada environment aplikasi."
    : "Tautan sudah kedaluwarsa, tidak valid, atau telah digunakan.";
  return <section className="mx-auto max-w-lg px-4 py-20 text-center"><p className="text-sm font-bold text-[var(--accent)]">Autentikasi</p><h1 className="mt-2 font-[family-name:var(--font-lora)] text-3xl font-bold">Tautan belum dapat diproses.</h1><p className="mt-4 text-[var(--muted)]">{message}</p><Link href="/auth/login" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-white">Kembali ke login</Link></section>;
}
