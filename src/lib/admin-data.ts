import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AdminNovel = {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  status: "draft" | "published";
  publishedAt: string | null;
  coverUrl: string | null;
  genres: string[];
  chapterCount: number;
};

export type AdminChapter = {
  id: string;
  novelId: string;
  chapterNumber: number;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  publishedAt: string | null;
};

export type AdminComment = {
  id: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  userId: string;
  chapterId: string;
  chapterTitle: string;
  chapterSlug: string;
  novelTitle: string;
  novelSlug: string;
};

function asPublicationStatus(value: string): "draft" | "published" {
  return value === "published" ? "published" : "draft";
}

function asCommentStatus(value: string): "pending" | "approved" | "rejected" {
  return value === "approved" || value === "rejected" ? value : "pending";
}

export async function getAdminOverview() {
  await requireAdmin();
  const supabase = await createClient();
  const [novels, chapters, drafts, published, pending] = await Promise.all([
    supabase.from("novels").select("id", { count: "exact", head: true }),
    supabase.from("chapters").select("id", { count: "exact", head: true }),
    supabase.from("novels").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("novels").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return {
    novelCount: novels.count ?? 0,
    chapterCount: chapters.count ?? 0,
    draftCount: drafts.count ?? 0,
    publishedCount: published.count ?? 0,
    pendingCommentCount: pending.count ?? 0,
    error: novels.error || chapters.error || drafts.error || published.error || pending.error
      ? "Ringkasan admin belum dapat dimuat seluruhnya."
      : null,
  };
}

export async function getAdminNovels(): Promise<{ novels: AdminNovel[]; error: string | null }> {
  await requireAdmin();
  const supabase = await createClient();
  const [novelsResult, chaptersResult] = await Promise.all([
    supabase.from("novels").select("id,title,slug,author_name,status,published_at,cover_url,genres").order("updated_at", { ascending: false }),
    supabase.from("chapters").select("novel_id"),
  ]);
  const chapterCounts = new Map<string, number>();
  (chaptersResult.data ?? []).forEach(({ novel_id }) => chapterCounts.set(novel_id, (chapterCounts.get(novel_id) ?? 0) + 1));
  return {
    novels: (novelsResult.data ?? []).map((novel) => ({
      id: novel.id,
      title: novel.title,
      slug: novel.slug,
      authorName: novel.author_name,
      status: asPublicationStatus(novel.status),
      publishedAt: novel.published_at,
      coverUrl: novel.cover_url,
      genres: novel.genres,
      chapterCount: chapterCounts.get(novel.id) ?? 0,
    })),
    error: novelsResult.error || chaptersResult.error ? "Daftar novel belum dapat dimuat." : null,
  };
}

export async function getAdminNovel(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: novel, error: novelError } = await supabase
    .from("novels")
    .select("id,title,slug,author_name,synopsis,status,published_at,cover_url,genres")
    .eq("id", id)
    .maybeSingle();
  if (!novel || novelError) return { novel: null, chapters: [] as AdminChapter[], error: "Novel tidak ditemukan atau belum dapat dimuat." };

  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("id,novel_id,chapter_number,title,slug,content,status,published_at")
    .eq("novel_id", id)
    .order("chapter_number", { ascending: true });
  return {
    novel: {
      id: novel.id,
      title: novel.title,
      slug: novel.slug,
      authorName: novel.author_name,
      synopsis: novel.synopsis ?? "",
      status: asPublicationStatus(novel.status),
      publishedAt: novel.published_at,
      coverUrl: novel.cover_url,
      genres: novel.genres,
    },
    chapters: (chapters ?? []).map((chapter) => ({
      id: chapter.id,
      novelId: chapter.novel_id,
      chapterNumber: chapter.chapter_number,
      title: chapter.title,
      slug: chapter.slug,
      content: chapter.content,
      status: asPublicationStatus(chapter.status),
      publishedAt: chapter.published_at,
    })),
    error: chaptersError ? "Daftar bab belum dapat dimuat." : null,
  };
}

export async function getAdminChapter(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("id,novel_id,chapter_number,title,slug,content,status,published_at")
    .eq("id", id)
    .maybeSingle();
  if (!chapter || chapterError) return { chapter: null, novel: null, error: "Bab tidak ditemukan atau belum dapat dimuat." };
  const { data: novel, error: novelError } = await supabase
    .from("novels")
    .select("id,title,slug")
    .eq("id", chapter.novel_id)
    .maybeSingle();
  return {
    chapter: {
      id: chapter.id,
      novelId: chapter.novel_id,
      chapterNumber: chapter.chapter_number,
      title: chapter.title,
      slug: chapter.slug,
      content: chapter.content,
      status: asPublicationStatus(chapter.status),
      publishedAt: chapter.published_at,
    },
    novel: novel ? { id: novel.id, title: novel.title, slug: novel.slug } : null,
    error: novelError ? "Novel induk bab belum dapat dimuat." : null,
  };
}

export async function getAdminComments(): Promise<{ comments: AdminComment[]; error: string | null }> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("id,body,status,created_at,user_id,chapter_id")
    .order("created_at", { ascending: true })
    .limit(100);
  const chapterIds = [...new Set((comments ?? []).map((comment) => comment.chapter_id))];
  const { data: chapters, error: chaptersError } = chapterIds.length
    ? await supabase.from("chapters").select("id,novel_id,title,slug").in("id", chapterIds)
    : { data: [], error: null };
  const novelIds = [...new Set((chapters ?? []).map((chapter) => chapter.novel_id))];
  const { data: novels, error: novelsError } = novelIds.length
    ? await supabase.from("novels").select("id,title,slug").in("id", novelIds)
    : { data: [], error: null };
  const chapterById = new Map((chapters ?? []).map((chapter) => [chapter.id, chapter]));
  const novelById = new Map((novels ?? []).map((novel) => [novel.id, novel]));
  return {
    comments: (comments ?? []).flatMap((comment) => {
      const chapter = chapterById.get(comment.chapter_id);
      const novel = chapter ? novelById.get(chapter.novel_id) : null;
      return chapter && novel ? [{
        id: comment.id,
        body: comment.body,
        status: asCommentStatus(comment.status),
        createdAt: comment.created_at,
        userId: comment.user_id,
        chapterId: comment.chapter_id,
        chapterTitle: chapter.title,
        chapterSlug: chapter.slug,
        novelTitle: novel.title,
        novelSlug: novel.slug,
      }] : [];
    }),
    error: commentsError || chaptersError || novelsError ? "Beberapa komentar belum dapat dimuat." : null,
  };
}
