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
  return { title: novel.title, description: novel.synopsis, alternates: { canonical: `/novels/${novel.slug}` }, openGraph: { title: novel.title, description: novel.synopsis, images: [{ url: novel.cover, alt: `Sampul ${novel.title}` }] } };
}

export default async function NovelDetailPage({ params }: Props) {
  const result = await getNovelBySlug((await params).slug);
  if (result.error) return <section className="mx-auto max-w-3xl px-4 py-20"><h1 className="font-[family-name:var(--font-lora)] text-3xl font-bold">Novel belum dapat dimuat.</h1><p className="mt-3 text-[var(--muted)]">{result.error}</p></section>;
  const novel = result.data;
  if (!novel) notFound();

  const readerState = await getReaderState(novel.id);
  const firstChapter = novel.chapters[0];
  const continuedChapter = novel.chapters.find((chapter) => chapter.id === readerState.progressChapterId);

  return <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16"><div className="grid gap-8 md:grid-cols-[280px_1fr]"><Image src={novel.cover} alt={`Sampul ${novel.title}`} width={720} height={960} priority className="w-full max-w-[280px] rounded-2xl border border-[var(--border)] shadow-md" /><div><div className="flex flex-wrap gap-2">{novel.genres.map((genre) => <span key={genre} className="rounded-full bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] px-3 py-1 text-xs font-bold text-[var(--accent)]">{genre}</span>)}</div><h1 className="mt-4 font-[family-name:var(--font-lora)] text-4xl font-bold leading-tight sm:text-5xl">{novel.title}</h1><p className="mt-3 text-[var(--muted)]">oleh {novel.author} · {novel.status}</p><p className="mt-7 max-w-2xl leading-8 text-[var(--muted)]">{novel.synopsis}</p><div className="mt-8 flex flex-wrap gap-3">{firstChapter ? <Link href={`/read/${novel.slug}/${firstChapter.slug}`} className="inline-flex min-h-12 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-white hover:bg-[var(--accent-strong)]">Mulai membaca</Link> : <span className="inline-flex min-h-12 items-center rounded-full border border-[var(--border)] px-5 text-sm text-[var(--muted)]">Belum ada bab terbit</span>}{continuedChapter && <Link href={`/read/${novel.slug}/${continuedChapter.slug}`} className="inline-flex min-h-12 items-center rounded-full border border-[var(--accent)] px-5 text-sm font-bold text-[var(--accent)]">Lanjut membaca ({readerState.progress}%)</Link>}<BookmarkButton novelId={novel.id} initialBookmarked={readerState.bookmarked} enabled={Boolean(getSupabaseConfig())} authenticated={Boolean(readerState.viewer)} /></div>{readerState.error && <p className="mt-3 text-sm text-red-600">{readerState.error}</p>}</div></div><div className="mt-14 border-t border-[var(--border)] pt-10"><h2 className="font-[family-name:var(--font-lora)] text-2xl font-bold">Daftar bab</h2>{novel.chapters.length ? <ol className="mt-5 divide-y divide-[var(--border)]">{novel.chapters.map((chapter) => <li key={chapter.slug}><Link href={`/read/${novel.slug}/${chapter.slug}`} className="flex items-center justify-between gap-4 py-4 transition hover:text-[var(--accent)]"><span><span className="mr-3 text-sm text-[var(--muted)]">{String(chapter.number).padStart(2, "0")}</span><span className="font-bold">{chapter.title}</span><span className="mt-1 block pl-7 text-sm text-[var(--muted)]">{chapter.excerpt}</span></span><span aria-hidden="true">→</span></Link></li>)}</ol> : <p className="mt-4 text-[var(--muted)]">Belum ada bab yang diterbitkan.</p>}</div></section>;
}
