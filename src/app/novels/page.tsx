import type { Metadata } from "next";
import { NovelExplorer } from "@/components/novel/novel-explorer";
import { getNovelCatalog } from "@/lib/novel-repository";

export const metadata: Metadata = {
  title: "Daftar Novel",
  description: "Jelajahi koleksi cerita orisinal di Ruang Aksara.",
  alternates: { canonical: "/novels" },
};

export default async function NovelsPage() {
  const { data, source, error } = await getNovelCatalog();
  return <section className="page-shell py-10 sm:py-16"><div className="max-w-3xl"><p className="section-eyebrow">Perpustakaan kecil kami</p><h1 className="mt-3 font-[family-name:var(--font-lora)] text-[clamp(2.4rem,6vw,4.25rem)] font-bold leading-[1.05] tracking-[-0.035em]">Cari cerita yang ingin kamu tinggali.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">Pilih judul atau suasana yang sesuai dengan waktumu hari ini. Semua cerita yang tampil sudah diterbitkan untuk dibaca.</p></div>{source === "local" && <p className="mt-7 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">Mode development: data contoh lokal aktif sampai environment Supabase diisi.</p>}{error && <p className="mt-7 rounded-xl bg-red-500/10 p-4 text-sm text-[var(--danger)]">{error}</p>}<div className="mt-9"><NovelExplorer novels={data} /></div></section>;
}
