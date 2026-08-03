import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterDeleteForm, ChapterForm } from "@/components/admin/content-forms";
import { getAdminChapter } from "@/lib/admin-data";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Edit bab", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminChapterPage({ params }: Props) {
  const { chapter, novel, error } = await getAdminChapter((await params).id);
  if (!chapter || !novel) notFound();
  return <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16"><Link href={`/admin/novels/${novel.id}`} className="text-sm font-bold text-[var(--accent)] hover:underline">← Kembali ke {novel.title}</Link><h1 className="mt-3 font-[family-name:var(--font-lora)] text-4xl font-bold">Edit bab {chapter.chapterNumber}</h1>{error && <p role="status" className="mt-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-800">{error}</p>}<div className="mt-8"><ChapterForm mode="update" values={chapter} /></div><section className="mt-12"><ChapterDeleteForm id={chapter.id} /></section></section>;
}
