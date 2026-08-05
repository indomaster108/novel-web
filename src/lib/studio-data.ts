import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type LoreCategory = "character" | "location" | "faction" | "magic_system" | "item" | "rule" | "other";

export type LoreEntry = {
  id: string;
  novelId: string;
  category: LoreCategory;
  name: string;
  summary: string;
  details: Record<string, unknown>;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type ChapterSummaryEntry = {
  id: string;
  novelId: string;
  chapterId: string | null;
  chapterNumber: number;
  summary: string;
  keyEvents: string[];
  characterDevelopments: Record<string, unknown>;
  createdAt?: string;
};

export async function getLoreBible(novelId: string, category?: LoreCategory): Promise<{ data: LoreEntry[]; error: string | null }> {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase.from("lore_bibles").select("*").eq("novel_id", novelId).order("name", { ascending: true });
  if (category) {
    query = query.eq("category", category);
  }
  const { data, error } = await query;
  if (error || !data) return { data: [], error: "Gagal memuat Lore Bible." };
  return {
    data: data.map((item) => ({
      id: item.id,
      novelId: item.novel_id,
      category: item.category as LoreCategory,
      name: item.name,
      summary: item.summary,
      details: item.details || {},
      tags: item.tags || [],
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })),
    error: null,
  };
}

export async function upsertLoreEntry(entry: { id?: string; novelId: string; category: LoreCategory; name: string; summary: string; details?: Record<string, unknown>; tags?: string[] }) {
  await requireAdmin();
  const supabase = await createClient();
  const payload = {
    novel_id: entry.novelId,
    category: entry.category,
    name: entry.name,
    summary: entry.summary,
    details: entry.details || {},
    tags: entry.tags || [],
  };

  if (entry.id) {
    const { data, error } = await supabase.from("lore_bibles").update(payload).eq("id", entry.id).select().single();
    return { data, error: error ? error.message : null };
  } else {
    const { data, error } = await supabase.from("lore_bibles").insert(payload).select().single();
    return { data, error: error ? error.message : null };
  }
}

export async function deleteLoreEntry(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("lore_bibles").delete().eq("id", id);
  return { error: error ? error.message : null };
}

export async function getChapterSummaries(novelId: string, limit: number = 20): Promise<{ data: ChapterSummaryEntry[]; error: string | null }> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chapter_summaries")
    .select("*")
    .eq("novel_id", novelId)
    .order("chapter_number", { ascending: false })
    .limit(limit);
  if (error || !data) return { data: [], error: "Gagal memuat rantai ringkasan bab." };
  return {
    data: data.map((item) => ({
      id: item.id,
      novelId: item.novel_id,
      chapterId: item.chapter_id,
      chapterNumber: item.chapter_number,
      summary: item.summary,
      keyEvents: item.key_events || [],
      characterDevelopments: item.character_developments || {},
      createdAt: item.created_at,
    })),
    error: null,
  };
}

export async function upsertChapterSummary(entry: { id?: string; novelId: string; chapterId?: string | null; chapterNumber: number; summary: string; keyEvents?: string[]; characterDevelopments?: Record<string, unknown> }) {
  await requireAdmin();
  const supabase = await createClient();
  const payload = {
    novel_id: entry.novelId,
    chapter_id: entry.chapterId || null,
    chapter_number: entry.chapterNumber,
    summary: entry.summary,
    key_events: entry.keyEvents || [],
    character_developments: entry.characterDevelopments || {},
  };

  if (entry.id) {
    const { data, error } = await supabase.from("chapter_summaries").update(payload).eq("id", entry.id).select().single();
    return { data, error: error ? error.message : null };
  } else {
    const { data, error } = await supabase.from("chapter_summaries").upsert(payload, { onConflict: "novel_id,chapter_number" }).select().single();
    return { data, error: error ? error.message : null };
  }
}

/**
 * 🚀 1-Click Instant Publishing Architecture:
 * Turns a draft chapter into a live published chapter in zero seconds without a deployment or build step.
 */
export async function publishChapterOnDemand(chapterId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("publish_chapter_on_demand", { target_chapter_id: chapterId });
  return { data, error: error ? error.message : null };
}

export async function logGenerationActivity(entry: { novelId: string; source: "web_studio" | "telegram_bot" | "discord_bot" | "cli"; promptInput: string; generatedOutput: string; status?: "completed" | "failed" }) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("generation_logs").insert({
    novel_id: entry.novelId,
    source: entry.source,
    prompt_input: entry.promptInput,
    generated_output: entry.generatedOutput,
    status: entry.status || "completed",
  });
  return { error: error ? error.message : null };
}
