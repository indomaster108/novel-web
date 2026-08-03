import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentForm } from "@/components/reader/comment-form";
import { ProgressTracker } from "@/components/reader/progress-tracker";
import { ReaderControls } from "@/components/reader/reader-controls";
import { getSupabaseConfig } from "@/lib/env";
import { getChapterBySlug, getNovelCatalog } from "@/lib/novel-repository";
import { getReaderState } from "@/lib/reader-data";

type Props = { params: Promise<{ novelSlug: string; chapterSlug: string }> };

// Reader progress and comments are session-aware, so this page must not share an ISR response.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateStaticParams() {
  const { data } = await getNovelCatalog();
  return data.flatMap((novel) => novel.chapters.map((chapter) => ({ novelSlug: novel.slug, chapterSlug: chapter.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { novelSlug, chapterSlug } = await params;
  const { data } = await getChapterBySlug(novelSlug, chapterSlug);
  if (!data?.novel || !data.chapter) return {};
  return { title: `${data.novel.title} — Bab ${data.chapter.number}: ${data.chapter.title}`, description: data.chapter.excerpt, alternates: { canonical: `/read/${data.novel.slug}/${data.chapter.slug}` } };
}

export default async function ReadPage({ params }: Props) {
  const { novelSlug, chapterSlug } = await params;
  const result = await getChapterBySlug(novelSlug, chapterSlug);
  if (result.error) return <section className="mx-auto max-w-3xl px-4 py-20"><h1 className="font-[family-name:var(--font-lora)] text-3xl font-bold">Bab belum dapat dimuat.</h1><p className="mt-3 text-[var(--muted)]">{result.error}</p></section>;
  if (!result.data?.novel || !result.data.chapter) notFound();
  const { novel, chapter } = result.data;
  const readerState = await getReaderState(novel.id, chapter.id);
  const currentIndex = novel.chapters.findIndex((item) => item.slug === chapter.slug);
  const previous = novel.chapters[currentIndex - 1];
  const next = novel.chapters[currentIndex + 1];
  const configured = Boolean(getSupabaseConfig());

  return <section className="pb-16"><div className="mx-auto max-w-3xl px-4 pt-9 sm:px-6"><Link href={`/novels/${novel.slug}`} className="text-sm font-bold text-[var(--accent)] hover:underline">← Kembali ke {novel.title}</Link><p className="mt-7 text-sm font-bold text-[var(--accent)]">Bab {chapter.number}</p><h1 className="mt-2 font-[family-name:var(--font-lora)] text-3xl font-bold sm:text-4xl">{chapter.title}</h1></div><ReaderControls>{chapter.paragraphs.map((paragraph, index) => <p key={index} className="mb-7 last:mb-0">{paragraph}</p>)}</ReaderControls><nav aria-label="Navigasi bab" className="mx-auto mb-12 grid max-w-3xl grid-cols-2 gap-3 px-4 sm:px-6">{previous ? <Link href={`/read/${novel.slug}/${previous.slug}`} className="min-h-16 rounded-xl border border-[var(--border)] p-3 text-sm font-bold hover:border-[var(--accent)]"><span className="block text-xs text-[var(--muted)]">← Bab sebelumnya</span>{previous.title}</Link> : <span />}{next ? <Link href={`/read/${novel.slug}/${next.slug}`} className="min-h-16 rounded-xl border border-[var(--border)] p-3 text-right text-sm font-bold hover:border-[var(--accent)]"><span className="block text-xs text-[var(--muted)]">Bab berikutnya →</span>{next.title}</Link> : <Link href={`/novels/${novel.slug}`} className="min-h-16 rounded-xl border border-[var(--border)] p-3 text-right text-sm font-bold hover:border-[var(--accent)]"><span className="block text-xs text-[var(--muted)]">Selesai membaca</span>Kembali ke novel</Link>}</nav><section aria-labelledby="comments-heading" className="mx-auto mb-14 max-w-3xl border-t border-[var(--border)] px-4 pt-10 sm:px-6"><h2 id="comments-heading" className="font-[family-name:var(--font-lora)] text-2xl font-bold">Komentar</h2><div className="mt-5 space-y-3">{readerState.comments.length ? readerState.comments.map((comment) => <article key={comment.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"><p className="leading-7">{comment.body}</p><p className="mt-2 text-xs text-[var(--muted)]">{comment.status === "pending" ? "Menunggu moderasi · " : ""}{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(comment.created_at))}</p></article>) : <p className="text-sm text-[var(--muted)]">Belum ada komentar yang dapat ditampilkan.</p>}</div><div className="mt-7"><CommentForm chapterId={chapter.id} novelSlug={novel.slug} chapterSlug={chapter.slug} enabled={configured} authenticated={Boolean(readerState.viewer)} /></div></section><ProgressTracker novelId={novel.id} chapterId={chapter.id} initialProgress={readerState.progress} enabled={configured} authenticated={Boolean(readerState.viewer)} /></section>;
}
