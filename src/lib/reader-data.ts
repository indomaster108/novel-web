import { getViewer } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getReaderState(novelId: string, chapterId?: string) {
  const viewer = await getViewer();
  if (!getSupabaseConfig()) {
    return { viewer, bookmarked: false, progress: 0, progressChapterId: null, comments: [], error: null };
  }

  const supabase = await createClient();
  const commentsPromise = chapterId
    ? supabase.from("comments").select("id,body,status,created_at").eq("chapter_id", chapterId).order("created_at", { ascending: true }).limit(100)
    : Promise.resolve({ data: [], error: null });
  const bookmarkPromise = viewer
    ? supabase.from("bookmarks").select("novel_id").eq("user_id", viewer.id).eq("novel_id", novelId).maybeSingle()
    : Promise.resolve({ data: null, error: null });
  const progressPromise = viewer
    ? supabase.from("reading_progress").select("chapter_id,progress_percent").eq("user_id", viewer.id).eq("novel_id", novelId).maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [comments, bookmark, progress] = await Promise.all([commentsPromise, bookmarkPromise, progressPromise]);
  return {
    viewer,
    bookmarked: Boolean(bookmark.data),
    progress: progress.data?.progress_percent ?? 0,
    progressChapterId: progress.data?.chapter_id ?? null,
    comments: comments.data ?? [],
    error: comments.error || bookmark.error || progress.error ? "Data pembaca belum dapat dimuat seluruhnya." : null,
  };
}
