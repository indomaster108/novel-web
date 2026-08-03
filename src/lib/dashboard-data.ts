import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type NovelSummary = {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  coverUrl: string | null;
};

export type DashboardBookmark = NovelSummary & { createdAt: string };
export type DashboardProgress = NovelSummary & {
  chapterId: string;
  chapterTitle: string;
  chapterSlug: string;
  progressPercent: number;
  updatedAt: string;
};

export type ReaderDashboard = {
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
  bookmarks: DashboardBookmark[];
  progress: DashboardProgress[];
  error: string | null;
};

export async function getReaderDashboard(): Promise<ReaderDashboard> {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const [profileResult, bookmarksResult, progressResult] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", viewer.id).maybeSingle(),
    supabase.from("bookmarks").select("novel_id,created_at").eq("user_id", viewer.id).order("created_at", { ascending: false }).limit(24),
    supabase.from("reading_progress").select("novel_id,chapter_id,progress_percent,updated_at").eq("user_id", viewer.id).order("updated_at", { ascending: false }).limit(24),
  ]);

  const novelIds = [...new Set([
    ...(bookmarksResult.data ?? []).map((item) => item.novel_id),
    ...(progressResult.data ?? []).map((item) => item.novel_id),
  ])];
  const chapterIds = [...new Set((progressResult.data ?? []).map((item) => item.chapter_id))];

  const [novelsResult, chaptersResult] = await Promise.all([
    novelIds.length
      ? supabase.from("novels").select("id,title,slug,author_name,cover_url").in("id", novelIds)
      : Promise.resolve({ data: [], error: null }),
    chapterIds.length
      ? supabase.from("chapters").select("id,title,slug").in("id", chapterIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const novels = new Map((novelsResult.data ?? []).map((novel) => [novel.id, {
    id: novel.id,
    title: novel.title,
    slug: novel.slug,
    authorName: novel.author_name,
    coverUrl: novel.cover_url,
  }]));
  const chapters = new Map((chaptersResult.data ?? []).map((chapter) => [chapter.id, chapter]));
  const bookmarks = (bookmarksResult.data ?? []).flatMap((bookmark) => {
    const novel = novels.get(bookmark.novel_id);
    return novel ? [{ ...novel, createdAt: bookmark.created_at }] : [];
  });
  const progress = (progressResult.data ?? []).flatMap((record) => {
    const novel = novels.get(record.novel_id);
    const chapter = chapters.get(record.chapter_id);
    return novel && chapter ? [{
      ...novel,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      chapterSlug: chapter.slug,
      progressPercent: record.progress_percent,
      updatedAt: record.updated_at,
    }] : [];
  });

  return {
    email: viewer.email,
    displayName: profileResult.data?.display_name ?? null,
    isAdmin: viewer.isAdmin,
    bookmarks,
    progress,
    error: profileResult.error || bookmarksResult.error || progressResult.error || novelsResult.error || chaptersResult.error
      ? "Sebagian data dashboard belum dapat dimuat. Coba muat ulang halaman ini."
      : null,
  };
}
