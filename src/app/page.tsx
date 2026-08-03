import Link from "next/link";
import { NovelCard } from "@/components/novel/novel-card";
import { getNovelCatalog } from "@/lib/novel-repository";

export default async function Home() {
  const { data: novels, source, error } = await getNovelCatalog();
  const featured = novels[0];

  return (
    <>
      <section className="overflow-hidden border-b border-[var(--border)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <div>
            <p className="text-sm font-bold tracking-[0.18em] text-[var(--accent)] uppercase">Cerita yang menemanimu pulang</p>
            <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-lora)] text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">Setiap halaman adalah ruang untuk <span className="text-[var(--accent)]">berhenti sejenak.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">Temukan cerita orisinal, baca dengan ritme sendiri, dan simpan bagian yang ingin kamu datangi lagi.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/novels" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-white transition hover:bg-[var(--accent-strong)]">Jelajahi novel</Link><Link href="/auth/register" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border)] px-5 text-sm font-bold hover:border-[var(--accent)] hover:text-[var(--accent)]">Buat akun</Link></div>
          </div>
          <aside className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[color:color-mix(in_srgb,var(--accent)_15%,transparent)] blur-2xl" />
            <p className="relative text-sm font-bold text-[var(--accent)]">Pilihan untuk sore ini</p>
            {featured ? <><p className="relative mt-4 font-[family-name:var(--font-lora)] text-3xl font-bold leading-tight">{featured.title}</p><p className="relative mt-3 text-sm leading-6 text-[var(--muted)]">{featured.synopsis}</p><Link href={`/novels/${featured.slug}`} className="relative mt-6 inline-flex text-sm font-bold text-[var(--accent)] underline underline-offset-4">Baca sinopsis</Link></> : <p className="relative mt-4 text-sm leading-6 text-[var(--muted)]">Belum ada novel terbit di koleksi.</p>}
          </aside>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        {source === "local" && <p className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">Mode development: menampilkan data lokal karena Supabase belum dikonfigurasi.</p>}
        {error && <p className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
        <div className="flex items-end justify-between gap-6"><div><p className="text-sm font-bold text-[var(--accent)]">Koleksi baru</p><h2 className="mt-2 font-[family-name:var(--font-lora)] text-3xl font-bold">Novel untuk dibawa pulang</h2></div><Link href="/novels" className="hidden text-sm font-bold text-[var(--accent)] sm:block">Lihat semua →</Link></div>
        {novels.length ? <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{novels.map((novel) => <NovelCard key={novel.slug} novel={novel} />)}</div> : <p className="mt-8 rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-[var(--muted)]">Belum ada novel yang diterbitkan.</p>}
      </section>
      <section className="border-y border-[var(--border)] bg-[var(--surface)]"><div className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><div className="max-w-2xl"><p className="text-sm font-bold text-[var(--accent)]">Untuk pembaca yang pelan</p><h2 className="mt-2 font-[family-name:var(--font-lora)] text-3xl font-bold">Bacaan yang tidak mengejar-ngejar.</h2><p className="mt-4 leading-7 text-[var(--muted)]">Atur ukuran teks dan tema pembaca, lalu biarkan cerita berjalan sesuai waktumu.</p></div></div></section>
    </>
  );
}
