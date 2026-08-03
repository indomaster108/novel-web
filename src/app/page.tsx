import type { Metadata } from "next";
import Image from "next/image";
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
  const accountLabel = viewer?.isAdmin
    ? "Buka area admin"
    : viewer
      ? "Buka dashboard"
      : "Buat akun pembaca";

  return (
    <>
      <section className="overflow-hidden border-b border-[var(--border)]">
        <div className="page-shell grid gap-9 py-10 sm:py-16 lg:grid-cols-[minmax(0,1.04fr)_minmax(22rem,.96fr)] lg:items-center lg:py-20">
          <div className="relative">
            <span className="section-eyebrow inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1.5">
              Cerita yang menemanimu pulang
            </span>
            <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-lora)] text-[clamp(2.55rem,7.8vw,5.15rem)] font-bold leading-[1.03] tracking-[-0.035em]">
              Bacaan yang memberi ruang untuk <span className="text-[var(--accent)]">bernapas.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
              Temukan cerita orisinal, atur suasana baca sesuai ritmemu, dan kembali ke halaman yang terakhir kamu tinggalkan.
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/novels" className="ui-button">
                Temukan cerita
                <ArrowIcon />
              </Link>
              <Link href={accountHref} className="ui-button-secondary">
                {accountLabel}
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-[var(--muted)] sm:text-sm">
              <li className="flex items-center gap-2"><CheckIcon /> Cerita orisinal</li>
              <li className="flex items-center gap-2"><CheckIcon /> Progres tersimpan privat</li>
              <li className="flex items-center gap-2"><CheckIcon /> Nyaman di ponsel</li>
            </ul>
          </div>

          <aside className="relative isolate overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-raised)] sm:p-6">
            <div className="absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-[var(--accent-soft)]" />
            <div className="absolute -bottom-28 -left-24 -z-10 size-72 rounded-full bg-[color:color-mix(in_srgb,var(--highlight)_12%,transparent)]" />
            <p className="section-eyebrow text-[var(--highlight)]">Pilihan untuk memulai</p>
            {featured ? (
              <div className="mt-4 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
                <Image
                  src={featured.cover}
                  alt={`Sampul ${featured.title}`}
                  width={720}
                  height={960}
                  priority
                  className="aspect-[3/4] h-auto w-full rounded-xl object-cover shadow-[0_16px_30px_rgb(31_43_36_/_18%)]"
                />
                <div className="flex min-w-0 flex-col items-start">
                  <p className="text-xs font-bold text-[var(--muted)]">oleh {featured.author}</p>
                  <h2 className="mt-2 font-[family-name:var(--font-lora)] text-2xl font-bold leading-tight sm:text-3xl">{featured.title}</h2>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--muted)]">{featured.synopsis}</p>
                  <Link href={`/novels/${featured.slug}`} className="mt-auto pt-4 text-sm font-extrabold text-[var(--accent)] hover:underline">
                    Lihat sebelum mulai <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Belum ada novel terbit di koleksi.</p>
            )}
          </aside>
        </div>
      </section>

      <section className="page-shell py-14 sm:py-20">
        {source === "local" && (
          <p className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">Mode development: menampilkan data lokal karena Supabase belum dikonfigurasi.</p>
        )}
        {error && <p className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="section-eyebrow">Koleksi baru</p>
            <h2 className="mt-2 font-[family-name:var(--font-lora)] text-3xl font-bold tracking-tight sm:text-4xl">Pilih cerita yang ingin kamu tinggali.</h2>
          </div>
          <Link href="/novels" className="hidden text-sm font-extrabold text-[var(--accent)] hover:underline sm:inline">
            Lihat semua <span aria-hidden="true">→</span>
          </Link>
        </div>
        {novels.length ? (
          <div className="mt-8 grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {novels.map((novel) => <NovelCard key={novel.slug} novel={novel} />)}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-[var(--muted)]">Belum ada novel yang diterbitkan.</p>
        )}
        <Link href="/novels" className="ui-button-secondary mt-6 w-full sm:hidden">Lihat seluruh koleksi</Link>
      </section>

      <section className="border-y border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_72%,transparent)]">
        <div className="page-shell grid gap-7 py-14 sm:py-18 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:items-center">
          <div>
            <p className="section-eyebrow">Untuk pembaca yang pelan</p>
            <h2 className="mt-2 max-w-md font-[family-name:var(--font-lora)] text-3xl font-bold tracking-tight sm:text-4xl">Bacaan yang tidak mengejar-ngejar.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <ReadingPrinciple title="Pilih suasana" text="Atur tema dan ukuran teks agar halaman terasa pas di mata." />
            <ReadingPrinciple title="Ikuti ritme" text="Bab tetap mudah diikuti, tanpa gangguan yang terburu-buru." />
            <ReadingPrinciple title="Kembali kapan saja" text="Simpan progres dan bookmark hanya di ruang akunmu sendiri." />
          </div>
        </div>
      </section>
    </>
  );
}

function ReadingPrinciple({ title, text }: { title: string; text: string }) {
  return <article className="ui-card p-5"><span className="grid size-8 place-items-center rounded-xl bg-[var(--accent-soft)] text-sm font-extrabold text-[var(--accent)]">✦</span><h3 className="mt-4 font-[family-name:var(--font-lora)] text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p></article>;
}

function CheckIcon() {
  return <span aria-hidden="true" className="grid size-4 place-items-center rounded-full bg-[var(--accent-soft)] text-[10px] text-[var(--accent)]">✓</span>;
}

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="ml-2 size-4 fill-none stroke-current" strokeWidth="2"><path d="M3 10h13M11 5l5 5-5 5" /></svg>;
}
