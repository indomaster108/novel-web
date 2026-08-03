import type { Metadata } from "next";
import Link from "next/link";
import { NovelForm } from "@/components/admin/content-forms";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Buat novel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewNovelPage() {
  await requireAdmin();
  return <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16"><Link href="/admin/novels" className="text-sm font-bold text-[var(--accent)] hover:underline">← Kembali ke daftar novel</Link><h1 className="mt-3 font-[family-name:var(--font-lora)] text-4xl font-bold">Buat novel</h1><p className="mt-3 text-[var(--muted)]">Simpan sebagai draft jika konten belum siap dipublikasikan.</p><div className="mt-8"><NovelForm mode="create" /></div></section>;
}
