"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseConfig } from "@/lib/env";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ReaderActionState = {
  status: "idle" | "error" | "success";
  message: string;
  bookmarked?: boolean;
};

const uuid = z.uuid("Identitas data tidak valid.");
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200);

const bookmarkSchema = z.object({
  novelId: uuid,
  intent: z.enum(["add", "remove"]),
});

const progressSchema = z.object({
  novelId: uuid,
  chapterId: uuid,
  progressPercent: z.coerce.number().int().min(0).max(100),
});

const commentSchema = z.object({
  chapterId: uuid,
  novelSlug: slug,
  chapterSlug: slug,
  body: z.string().trim().min(1, "Komentar tidak boleh kosong.").max(2000, "Komentar maksimal 2.000 karakter."),
});

const unavailable: ReaderActionState = { status: "error", message: "Supabase belum dikonfigurasi." };

export async function toggleBookmarkAction(_state: ReaderActionState, formData: FormData): Promise<ReaderActionState> {
  if (!getSupabaseConfig()) return unavailable;
  const parsed = bookmarkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Permintaan bookmark tidak valid." };
  const viewer = await requireViewer();
  const supabase = await createClient();

  const result = parsed.data.intent === "add"
    ? await supabase.from("bookmarks").insert({ user_id: viewer.id, novel_id: parsed.data.novelId })
    : await supabase.from("bookmarks").delete().eq("user_id", viewer.id).eq("novel_id", parsed.data.novelId);

  if (result.error) return { status: "error", message: "Bookmark belum dapat diperbarui." };
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: parsed.data.intent === "add" ? "Novel disimpan ke bookmark." : "Novel dihapus dari bookmark.",
    bookmarked: parsed.data.intent === "add",
  };
}

export async function saveProgressAction(_state: ReaderActionState, formData: FormData): Promise<ReaderActionState> {
  if (!getSupabaseConfig()) return unavailable;
  const parsed = progressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Progres membaca tidak valid." };
  const viewer = await requireViewer();
  const supabase = await createClient();
  const { error } = await supabase.from("reading_progress").upsert(
    {
      user_id: viewer.id,
      novel_id: parsed.data.novelId,
      chapter_id: parsed.data.chapterId,
      progress_percent: parsed.data.progressPercent,
    },
    { onConflict: "user_id,novel_id" },
  );

  if (error) return { status: "error", message: "Progres belum dapat disimpan." };
  revalidatePath("/dashboard");
  return { status: "success", message: `Progres ${parsed.data.progressPercent}% tersimpan.` };
}

export async function addCommentAction(_state: ReaderActionState, formData: FormData): Promise<ReaderActionState> {
  if (!getSupabaseConfig()) return unavailable;
  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Komentar tidak valid." };
  const viewer = await requireViewer();
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    user_id: viewer.id,
    chapter_id: parsed.data.chapterId,
    body: parsed.data.body,
    status: "pending",
  });

  if (error) return { status: "error", message: "Komentar belum dapat dikirim." };
  revalidatePath(`/read/${parsed.data.novelSlug}/${parsed.data.chapterSlug}`);
  return { status: "success", message: "Komentar dikirim dan menunggu moderasi." };
}
