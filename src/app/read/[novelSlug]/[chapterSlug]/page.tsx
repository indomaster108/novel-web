import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentForm } from "@/components/reader/comment-form";
import { ProgressTracker } from "@/components/reader/progress-tracker";
import { ReaderControls } from "@/components/reader/reader-controls";
import { getSupabaseConfig } from "@/lib/env";
import { getChapterBySlug, getNovelCatalog } from "@/lib/novel-repository";
import { getReaderState } from "@/lib/reader-data";
import { siteUrl } from "@/lib/site";

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
  return {
    title: `${data.novel.title} — Bab ${data.chapter.number}: ${data.chapter.title}`,
    description: data.chapter.excerpt || `Baca bab ${data.chapter.number} dari novel ${data.novel.title} karya ${data.novel.author} secara online.`,
    alternates: { canonical: `/read/${data.novel.slug}/${data.chapter.slug}` },
    openGraph: {
      title: `${data.novel.title} — Bab ${data.chapter.number}: ${data.chapter.title}`,
      description: data.chapter.excerpt,
      type: "article",
      authors: [data.novel.author],
      images: [{ url: data.novel.cover, alt: `Sampul ${data.novel.title}` }],
    },
    twitter: {
      card: "summary",
      title: `${data.novel.title} — Bab ${data.chapter.number}`,
      description: data.chapter.excerpt,
      images: [data.novel.cover],
    },
  };
}

export default async function ReadPage({ params }: Props) {
  const { novelSlug, chapterSlug } = await params;
  const result = await getChapterBySlug(novelSlug, chapterSlug);
  if (result.error) return <section className="page-shell py-20"><h1 className="font-[family-name:var(--font-lora)] text-3xl font-bold">Bab belum dapat dimuat.</h1><p className="mt-3 text-[var(--muted)]">{result.error}</p></section>;
  if (!result.data?.novel || !result.data.chapter) notFound();

  const { novel, chapter } = result.data;
  const readerState = await getReaderState(novel.id, chapter.id);
  const currentIndex = novel.chapters.findIndex((item) => item.slug === chapter.slug);
  const previous = novel.chapters[currentIndex - 1];
  const next = novel.chapters[currentIndex + 1];
  const configured = Boolean(getSupabaseConfig());

  // 🚀 Enterprise SEO: JSON-LD Chapter Schema for deep literature indexing & structural snippet hierarchy
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: `Bab ${chapter.number}: ${chapter.title}`,
    position: chapter.number,
    url: `${siteUrl}/read/${novel.slug}/${chapter.slug}`,
    description: chapter.excerpt || `${chapter.title} - Bagian dari novel ${novel.title} karya ${novel.author}.`,
    isPartOf: {
      "@type": "Book",
      name: novel.title,
      author: {
        "@type": "Person",
        name: novel.author,
      },
      url: `${siteUrl}/novels/${novel.slug}`,
      image: novel.cover,
    },
  };

  return <section className="pb-24">
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div className="page-shell pt-8 sm:pt-10">
      <Link href={`/novels/${novel.slug}`} className="inline-flex min-h-10 items-center text-sm font-extrabold text-[var(--accent)] hover:underline"><span aria-hidden="true" className="mr-2">←</span>{novel.title}</Link>
      <div className="mt-7 border-l-2 border-[var(--accent)] pl-4 sm:pl-5"><p className="section-eyebrow">Bab {chapter.number} dari {novel.chapters.length}</p><h1 className="mt-2 max-w-3xl font-[family-name:var(--font-lora)] text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.1] tracking-tight">{chapter.title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Tarik napas, pilih tampilan yang nyaman, lalu lanjutkan ketika kamu siap.</p></div>
    </div>

    <ReaderControls>{chapter.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</ReaderControls>

    <nav aria-label="Navigasi bab" className="page-shell mb-12 grid grid-cols-2 gap-3">
      {previous ? <Link href={`/read/${novel.slug}/${previous.slug}`} className="group min-h-20 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)] hover:shadow-sm"><span className="block text-xs font-bold text-[var(--muted)]"><span aria-hidden="true">← </span>Bab sebelumnya</span><span className="mt-2 block line-clamp-2 text-sm font-extrabold group-hover:text-[var(--accent)]">{previous.title}</span></Link> : <span aria-hidden="true" />}
      {next ? <Link href={`/read/${novel.slug}/${next.slug}`} className="group min-h-20 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-right transition hover:border-[var(--accent)] hover:shadow-sm"><span className="block text-xs font-bold text-[var(--muted)]">Bab berikutnya <span aria-hidden="true">→</span></span><span className="mt-2 block line-clamp-2 text-sm font-extrabold group-hover:text-[var(--accent)]">{next.title}</span></Link> : <Link href={`/novels/${novel.slug}`} className="group min-h-20 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-right transition hover:border-[var(--accent)] hover:shadow-sm"><span className="block text-xs font-bold text-[var(--muted)]">Selesai membaca</span><span className="mt-2 block text-sm font-extrabold group-hover:text-[var(--accent)]">Kembali ke novel <span aria-hidden="true">→</span></span></Link>}
    </nav>

    <section aria-labelledby="comments-heading" className="page-shell mb-12 max-w-[47rem] border-t border-[var(--border)] pt-9 sm:pt-10">
      <p className="section-eyebrow">Ruang tanggapan</p><h2 id="comments-heading" className="mt-2 font-[family-name:var(--font-lora)] text-2xl font-bold">Komentar pembaca</h2>
      <div className="mt-5 space-y-3">{readerState.comments.length ? readerState.comments.map((comment) => <article key={comment.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"><p className="leading-7">{comment.body}</p><p className="mt-3 text-xs text-[var(--muted)]">{comment.status === "pending" ? "Menunggu moderasi · " : ""}{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(comment.created_at))}</p></article>) : <p className="rounded-2xl bg-[var(--surface-2)] p-4 text-sm leading-6 text-[var(--muted)]">Belum ada komentar yang dapat ditampilkan. Jadilah pembaca pertama yang berbagi kesan.</p>}</div>
      <div className="mt-7"><CommentForm chapterId={chapter.id} novelSlug={novel.slug} chapterSlug={chapter.slug} enabled={configured} authenticated={Boolean(readerState.viewer)} /></div>
    </section>
    <ProgressTracker novelId={novel.id} chapterId={chapter.id} initialProgress={readerState.progress} enabled={configured} authenticated={Boolean(readerState.viewer)} />
  </section>;
}
