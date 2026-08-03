import type { Metadata } from "next";
import { NovelExplorer } from "@/components/novel/novel-explorer";
import { getNovelCatalog } from "@/lib/novel-repository";

export const metadata: Metadata = { title: "Daftar Novel", description: "Jelajahi koleksi cerita orisinal di Ruang Aksara.", alternates: { canonical: "/novels" } };

export default async function NovelsPage() {
  const { data, source, error } = await getNovelCatalog();
  return <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"><p className="text-sm font-bold text-[var(--accent)]">Perpustakaan kecil kami</p><h1 className="mt-2 font-[family-name:var(--font-lora)] text-4xl font-bold">Cari cerita yang ingin kamu tinggali.</h1><p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">Koleksi terbit dimuat melalui Supabase dan dilindungi oleh Row Level Security.</p>{source === "local" && <p className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">Mode development: data contoh lokal aktif sampai environment Supabase diisi.</p>}{error && <p className="mt-6 rounded-xl bg-red-500/10 p-4 text-sm">{error}</p>}<div className="mt-9"><NovelExplorer novels={data} /></div></section>;
}
