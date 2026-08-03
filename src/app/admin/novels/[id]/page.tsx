import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterForm, NovelDeleteForm, NovelForm } from "@/components/admin/content-forms";
import { CoverUploadForm } from "@/components/admin/cover-upload-form";
import { getAdminNovel } from "@/lib/admin-data";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Kelola novel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminNovelPage({ params }: Props) {
  const { novel, chapters, error } = await getAdminNovel((await params).id);
  if (!novel) notFound();
  return <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16"><Link href="/admin/novels" className="text-sm font-bold text-[var(--accent)] hover:underline">← Kembali ke daftar novel</Link><h1 className="mt-3 font-[family-name:var(--font-lora)] text-4xl font-bold">Kelola {novel.title}</h1>{error && <p role="status" className="mt-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-800">{error}</p>}<div className="mt-8"><NovelForm mode="update" values={novel} /></div><section className="mt-10"><h2 className="font-[family-name:var(--font-lora)] text-2xl font-bold">Upload cover</h2><p className="mt-2 text-sm text-[var(--muted)]">Setelah upload berhasil, tempel URL pada formulir novel di atas lalu simpan.</p><CoverUploadForm /></section><section className="mt-12"><h2 className="font-[family-name:var(--font-lora)] text-2xl font-bold">Daftar bab</h2>{chapters.length ? <div className="mt-4 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)]">{chapters.map((chapter) => <div key={chapter.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-bold">Bab {chapter.chapterNumber}: {chapter.title}</p><p className="mt-1 text-xs text-[var(--muted)]">/{chapter.slug} · {chapter.status === "published" ? "Terbit" : "Draft"}</p></div><Link href={`/admin/chapters/${chapter.id}`} className="min-h-10 rounded-full border border-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent)]">Edit bab</Link></div>)}</div> : <p className="mt-4 text-sm text-[var(--muted)]">Belum ada bab.</p>}</section><section className="mt-12"><h2 className="font-[family-name:var(--font-lora)] text-2xl font-bold">Tambah bab</h2><div className="mt-5"><ChapterForm mode="create" values={{ novelId: novel.id, chapterNumber: chapters.length + 1 }} /></div></section><section className="mt-12"><NovelDeleteForm id={novel.id} /></section></section>;
}
