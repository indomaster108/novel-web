import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookmarkButton } from "@/components/novel/bookmark-button";
import { getSupabaseConfig } from "@/lib/env";
import { getNovelBySlug, getNovelCatalog } from "@/lib/novel-repository";
import { getReaderState } from "@/lib/reader-data";

type Props = { params: Promise<{ slug: string }> };

// This route renders reader-specific bookmark/progress state from cookies.
// Keeping it dynamic prevents a user's state or refreshed session headers being cached publicly.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateStaticParams() {
  const { data } = await getNovelCatalog();
  return data.map((novel) => ({ slug: novel.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: novel } = await getNovelBySlug((await params).slug);
  if (!novel) return {};
  return {
    title: novel.title,
    description: novel.synopsis,
    alternates: { canonical: `/novels/${novel.slug}` },
    openGraph: {
      title: novel.title,
      description: novel.synopsis,
      images: [{ url: novel.cover, alt: `Sampul ${novel.title}` }],
    },
  };
}

export default async function NovelDetailPage({ params }: Props) {
  const result = await getNovelBySlug((await params).slug);
  if (result.error) {
    return <section className="page-shell py-20"><h1 className="font-[family-name:var(--font-lora)] text-3xl font-bold">Novel belum dapat dimuat.</h1><p className="mt-3 text-[var(--muted)]">{result.error}</p></section>;
  }
  const novel = result.data;
  if (!novel) notFound();

  const readerState = await getReaderState(novel.id);
  const firstChapter = novel.chapters[0];
  const continuedChapter = novel.chapters.find((chapter) => chapter.id === readerState.progressChapterId);

  return (
    <section className="page-shell py-8 sm:py-12 lg:py-16">
      <Link href="/novels" className="inline-flex min-h-10 items-center text-sm font-extrabold text-[var(--accent)] hover:underline"><span aria-hidden="true" className="mr-2">←</span>Kembali ke koleksi</Link>
      <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(14rem,19rem)_minmax(0,1fr)] lg:gap-12">
        <div className="mx-auto w-full max-w-[19rem] lg:mx-0 lg:sticky lg:top-24 lg:self-start">
          <Image src={novel.cover} alt={`Sampul ${novel.title}`} width={720} height={960} priority className="aspect-[3/4] w-full rounded-[1.35rem] border border-[var(--border)] object-cover shadow-[var(--shadow-raised)]" />
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-bold text-[var(--muted)]"><span className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5">{novel.chapters.length} bab tersedia</span><span className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5 capitalize">{novel.status}</span></div>
        </div>

        <div className="min-w-0 pt-1">
          <div className="flex flex-wrap gap-2">{novel.genres.map((genre) => <span key={genre} className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-extrabold text-[var(--accent)]">{genre}</span>)}</div>
          <p className="mt-6 text-sm font-bold text-[var(--highlight)]">oleh {novel.author}</p>
          <h1 className="mt-2 max-w-3xl font-[family-name:var(--font-lora)] text-[clamp(2.4rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.035em]">{novel.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">{novel.synopsis}</p>

          <div className="ui-card mt-8 max-w-2xl p-4 sm:p-5">
            <p className="section-eyebrow">Siap ketika kamu siap</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {firstChapter ? <Link href={`/read/${novel.slug}/${firstChapter.slug}`} className="ui-button">Mulai dari bab pertama <span aria-hidden="true" className="ml-2">→</span></Link> : <span className="ui-button-secondary text-[var(--muted)]">Belum ada bab terbit</span>}
              {continuedChapter && <Link href={`/read/${novel.slug}/${continuedChapter.slug}`} className="ui-button-secondary">Lanjut dari {readerState.progress}%</Link>}
              <BookmarkButton novelId={novel.id} initialBookmarked={readerState.bookmarked} enabled={Boolean(getSupabaseConfig())} authenticated={Boolean(readerState.viewer)} />
            </div>
            {readerState.error && <p className="mt-3 text-sm text-[var(--danger)]">{readerState.error}</p>}
          </div>

          <div className="mt-12 border-t border-[var(--border)] pt-8 sm:mt-14 sm:pt-10">
            <div className="flex items-end justify-between gap-4"><div><p className="section-eyebrow">Daftar bab</p><h2 className="mt-2 font-[family-name:var(--font-lora)] text-3xl font-bold">Mulai dari mana pun.</h2></div><p className="hidden text-sm text-[var(--muted)] sm:block">Baca sesuai alur yang nyaman.</p></div>
            {novel.chapters.length ? <ol className="mt-6 grid gap-3">{novel.chapters.map((chapter) => <li key={chapter.slug}><Link href={`/read/${novel.slug}/${chapter.slug}`} className="group flex min-h-20 items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)] hover:shadow-sm sm:p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)] text-sm font-extrabold text-[var(--accent)]">{String(chapter.number).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="block font-bold transition group-hover:text-[var(--accent)]">{chapter.title}</span><span className="mt-1 block line-clamp-1 text-sm text-[var(--muted)]">{chapter.excerpt}</span></span><span aria-hidden="true" className="text-lg text-[var(--accent)]">→</span></Link></li>)}</ol> : <p className="mt-4 text-[var(--muted)]">Belum ada bab yang diterbitkan.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
