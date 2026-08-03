import type { Metadata } from "next";
import Link from "next/link";
import { NovelCard } from "@/components/novel/novel-card";
import { getViewer } from "@/lib/auth";
import { getNovelCatalog } from "@/lib/novel-repository";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [{ data: novels, source, error }, viewer] = await Promise.all([
    getNovelCatalog(),
    getViewer(),
  ]);
  const featured = novels[0];
  const accountHref = viewer?.isAdmin ? "/admin" : viewer ? "/dashboard" : "/auth/register";
  const accountLabel = viewer?.isAdmin ? "Buka area admin" : viewer ? "Buka dashboard" : "Buat akun pembaca";

  return (
    <>
      <section className="overflow-hidden border-b border-[var(--border)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-extrabold tracking-[0.14em] text-[var(--accent)] uppercase">Cerita yang menemanimu pulang</span>
            <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-lora)] text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">Setiap halaman, ruang untuk <span className="text-[var(--accent)]">berhenti sejenak.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">Temukan cerita orisinal, baca dengan ritme sendiri, dan simpan bagian yang ingin kamu datangi lagi.</p>
            <div className="mt-8 grid gap-3 sm:flex"><Link href="/novels" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--accent)] px-5 text-sm font-extrabold text-white shadow-[0_12px_32px_color-mix(in_srgb,var(--accent)_20%,transparent)] transition hover:bg-[var(--accent-strong)]">Jelajahi novel</Link><Link href={accountHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-extrabold hover:border-[var(--accent)] hover:text-[var(--accent)]">{accountLabel}</Link></div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-[var(--muted)]"><span>✓ Cerita orisinal</span><span>✓ Progres privat</span><span>✓ Nyaman di ponsel</span></div>
          </div>
          <aside className="relative overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
            <div className="absolute -right-14 -top-14 size-44 rounded-full bg-[var(--accent-soft)]" />
            <p className="relative text-xs font-extrabold tracking-[0.14em] text-[var(--highlight)] uppercase">Pilihan editor</p>
            {featured ? <><p className="relative mt-4 font-[family-name:var(--font-lora)] text-3xl font-bold leading-tight sm:text-4xl">{featured.title}</p><p className="relative mt-4 line-clamp-4 text-sm leading-7 text-[var(--muted)]">{featured.synopsis}</p><div className="relative mt-6 flex items-center justify-between gap-4"><p className="text-xs font-bold text-[var(--muted)]">oleh {featured.author}</p><Link href={`/novels/${featured.slug}`} className="inline-flex min-h-11 items-center rounded-xl bg-[var(--accent-soft)] px-4 text-sm font-extrabold text-[var(--accent)]">Lihat novel →</Link></div></> : <p className="relative mt-4 text-sm leading-6 text-[var(--muted)]">Belum ada novel terbit di koleksi.</p>}
          </aside>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        {source === "local" && <p className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">Mode development: menampilkan data lokal karena Supabase belum dikonfigurasi.</p>}
        {error && <p className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
        <div className="flex items-end justify-between gap-6"><div><p className="text-sm font-bold text-[var(--accent)]">Koleksi baru</p><h2 className="mt-2 font-[family-name:var(--font-lora)] text-3xl font-bold">Novel untuk dibawa pulang</h2></div><Link href="/novels" className="hidden text-sm font-bold text-[var(--accent)] sm:block">Lihat semua →</Link></div>
        {novels.length ? <div className="mt-8 grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">{novels.map((novel) => <NovelCard key={novel.slug} novel={novel} />)}</div> : <p className="mt-8 rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-[var(--muted)]">Belum ada novel yang diterbitkan.</p>}
      </section>
      <section className="border-y border-[var(--border)] bg-[var(--surface)]"><div className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><div className="max-w-2xl"><p className="text-sm font-bold text-[var(--accent)]">Untuk pembaca yang pelan</p><h2 className="mt-2 font-[family-name:var(--font-lora)] text-3xl font-bold">Bacaan yang tidak mengejar-ngejar.</h2><p className="mt-4 leading-7 text-[var(--muted)]">Atur ukuran teks dan tema pembaca, lalu biarkan cerita berjalan sesuai waktumu.</p></div></div></section>
    </>
  );
}
