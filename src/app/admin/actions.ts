"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type UploadState = { status: "idle" | "error" | "success"; message: string; url?: string };
export type AdminActionState = { status: "idle" | "error" | "success"; message: string };

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
const extensionByType: Record<(typeof allowedTypes)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const uploadSchema = z.object({
  cover: z.instanceof(File)
    .refine((file) => file.size > 0 && file.size <= 5 * 1024 * 1024, "Ukuran cover harus antara 1 byte dan 5 MB.")
    .refine((file) => allowedTypes.includes(file.type as (typeof allowedTypes)[number]), "Format cover harus JPEG, PNG, WebP, atau AVIF."),
});

const uuid = z.uuid("Identitas data tidak valid.");
const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.").max(200);
const publicationStatus = z.enum(["draft", "published"]);
const confirmDelete = z.literal("DELETE", "Konfirmasi penghapusan diperlukan.");

const novelInputSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi.").max(200),
  slug,
  authorName: z.string().trim().min(1, "Nama penulis wajib diisi.").max(120),
  synopsis: z.string().trim().max(5000, "Sinopsis maksimal 5.000 karakter."),
  coverUrl: z.union([z.literal(""), z.url("URL cover tidak valid.").max(2048)]),
  genres: z.string().trim().max(500, "Daftar genre terlalu panjang."),
  status: publicationStatus,
});

const chapterInputSchema = z.object({
  novelId: uuid,
  chapterNumber: z.coerce.number().int().min(1, "Nomor bab harus minimal 1.").max(100000),
  title: z.string().trim().min(1, "Judul bab wajib diisi.").max(200),
  slug,
  content: z.string().trim().min(1, "Isi bab wajib diisi.").max(100000, "Isi bab maksimal 100.000 karakter."),
  status: publicationStatus,
});

function toGenres(value: string) {
  const genres = [...new Set(value.split(",").map((genre) => genre.trim()).filter(Boolean))];
  if (genres.length > 12 || genres.some((genre) => genre.length > 40)) return null;
  return genres;
}

function isAllowedCoverUrl(value: string) {
  if (!value) return true;
  const config = getSupabaseConfig();
  if (!config) return false;
  try {
    const coverUrl = new URL(value);
    const supabaseUrl = new URL(config.url);
    return coverUrl.protocol === "https:"
      && coverUrl.origin === supabaseUrl.origin
      && coverUrl.pathname.startsWith("/storage/v1/object/public/covers/");
  } catch {
    return false;
  }
}

function invalid(message: string): AdminActionState {
  return { status: "error", message };
}

function revalidatePublicNovel(slug: string, previousSlug?: string) {
  revalidateTag("published-novel-catalog", "max");
  revalidatePath("/");
  revalidatePath("/novels");
  revalidatePath("/sitemap.xml");
  revalidatePath(`/novels/${slug}`);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/novels/${previousSlug}`);
}

async function hasExpectedSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (file.type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (file.type === "image/avif") return String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" && ["avif", "avis"].includes(String.fromCharCode(...bytes.slice(8, 12)));
  return false;
}

export async function uploadCoverAction(_state: UploadState, formData: FormData): Promise<UploadState> {
  if (!getSupabaseConfig()) return { status: "error", message: "Supabase belum dikonfigurasi." };
  await requireAdmin();
  const parsed = uploadSchema.safeParse({ cover: formData.get("cover") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "File tidak valid." };

  const file = parsed.data.cover;
  if (!(await hasExpectedSignature(file))) {
    return { status: "error", message: "Isi file tidak cocok dengan format gambar yang dinyatakan." };
  }
  const extension = extensionByType[file.type as (typeof allowedTypes)[number]];
  const objectPath = `novels/${crypto.randomUUID()}.${extension}`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from("covers").upload(objectPath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) return { status: "error", message: "Cover belum dapat diunggah." };

  const { data } = supabase.storage.from("covers").getPublicUrl(objectPath);
  return { status: "success", message: "Cover berhasil diunggah.", url: data.publicUrl };
}

export async function createNovelAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!getSupabaseConfig()) return invalid("Supabase belum dikonfigurasi.");
  const parsed = novelInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? "Data novel tidak valid.");
  const genres = toGenres(parsed.data.genres);
  if (!genres) return invalid("Gunakan maksimal 12 genre, masing-masing maksimal 40 karakter.");
  if (!isAllowedCoverUrl(parsed.data.coverUrl)) return invalid("Gunakan URL cover yang dihasilkan dari bucket covers proyek ini.");
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("novels").insert({
    title: parsed.data.title,
    slug: parsed.data.slug,
    author_name: parsed.data.authorName,
    synopsis: parsed.data.synopsis || null,
    cover_url: parsed.data.coverUrl || null,
    genres,
    status: parsed.data.status,
    published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
  }).select("id").single();
  if (error || !data) return invalid(error?.code === "23505" ? "Slug novel sudah dipakai." : "Novel belum dapat dibuat.");
  revalidatePublicNovel(parsed.data.slug);
  revalidatePath("/admin");
  revalidatePath("/admin/novels");
  redirect(`/admin/novels/${data.id}`);
}

export async function updateNovelAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!getSupabaseConfig()) return invalid("Supabase belum dikonfigurasi.");
  const idResult = uuid.safeParse(formData.get("id"));
  const parsed = novelInputSchema.safeParse(Object.fromEntries(formData));
  if (!idResult.success) return invalid("Identitas novel tidak valid.");
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? "Data novel tidak valid.");
  const genres = toGenres(parsed.data.genres);
  if (!genres) return invalid("Gunakan maksimal 12 genre, masing-masing maksimal 40 karakter.");
  if (!isAllowedCoverUrl(parsed.data.coverUrl)) return invalid("Gunakan URL cover yang dihasilkan dari bucket covers proyek ini.");
  await requireAdmin();
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase.from("novels").select("slug,status,published_at").eq("id", idResult.data).maybeSingle();
  if (existingError || !existing) return invalid("Novel tidak ditemukan.");
  const { error } = await supabase.from("novels").update({
    title: parsed.data.title,
    slug: parsed.data.slug,
    author_name: parsed.data.authorName,
    synopsis: parsed.data.synopsis || null,
    cover_url: parsed.data.coverUrl || null,
    genres,
    status: parsed.data.status,
    published_at: parsed.data.status === "published" ? existing.published_at ?? new Date().toISOString() : null,
  }).eq("id", idResult.data);
  if (error) return invalid(error.code === "23505" ? "Slug novel sudah dipakai." : "Novel belum dapat diperbarui.");
  revalidatePublicNovel(parsed.data.slug, existing.slug);
  revalidatePath("/admin");
  revalidatePath("/admin/novels");
  revalidatePath(`/admin/novels/${idResult.data}`);
  return { status: "success", message: "Novel diperbarui." };
}

export async function deleteNovelAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!getSupabaseConfig()) return invalid("Supabase belum dikonfigurasi.");
  const parsed = z.object({ id: uuid, confirmation: confirmDelete }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? "Permintaan penghapusan tidak valid.");
  await requireAdmin();
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase.from("novels").select("slug").eq("id", parsed.data.id).maybeSingle();
  if (existingError || !existing) return invalid("Novel tidak ditemukan.");
  const { error } = await supabase.from("novels").delete().eq("id", parsed.data.id);
  if (error) return invalid("Novel belum dapat dihapus.");
  revalidatePublicNovel(existing.slug);
  revalidatePath("/admin");
  revalidatePath("/admin/novels");
  redirect("/admin/novels");
}

export async function createChapterAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!getSupabaseConfig()) return invalid("Supabase belum dikonfigurasi.");
  const parsed = chapterInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? "Data bab tidak valid.");
  await requireAdmin();
  const supabase = await createClient();
  const { data: novel, error: novelError } = await supabase.from("novels").select("slug,status").eq("id", parsed.data.novelId).maybeSingle();
  if (novelError || !novel) return invalid("Novel induk tidak ditemukan.");
  const { data, error } = await supabase.from("chapters").insert({
    novel_id: parsed.data.novelId,
    chapter_number: parsed.data.chapterNumber,
    title: parsed.data.title,
    slug: parsed.data.slug,
    content: parsed.data.content,
    status: parsed.data.status,
    published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
  }).select("id").single();
  if (error || !data) return invalid(error?.code === "23505" ? "Nomor atau slug bab sudah dipakai pada novel ini." : "Bab belum dapat dibuat.");
  if (novel.status === "published") revalidatePublicNovel(novel.slug);
  revalidatePath(`/admin/novels/${parsed.data.novelId}`);
  redirect(`/admin/chapters/${data.id}`);
}

export async function updateChapterAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!getSupabaseConfig()) return invalid("Supabase belum dikonfigurasi.");
  const idResult = uuid.safeParse(formData.get("id"));
  const parsed = chapterInputSchema.safeParse(Object.fromEntries(formData));
  if (!idResult.success) return invalid("Identitas bab tidak valid.");
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? "Data bab tidak valid.");
  await requireAdmin();
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase.from("chapters").select("novel_id,status,published_at").eq("id", idResult.data).maybeSingle();
  if (existingError || !existing || existing.novel_id !== parsed.data.novelId) return invalid("Bab tidak ditemukan.");
  const { data: novel, error: novelError } = await supabase.from("novels").select("slug,status").eq("id", parsed.data.novelId).maybeSingle();
  if (novelError || !novel) return invalid("Novel induk tidak ditemukan.");
  const { error } = await supabase.from("chapters").update({
    chapter_number: parsed.data.chapterNumber,
    title: parsed.data.title,
    slug: parsed.data.slug,
    content: parsed.data.content,
    status: parsed.data.status,
    published_at: parsed.data.status === "published" ? existing.published_at ?? new Date().toISOString() : null,
  }).eq("id", idResult.data);
  if (error) return invalid(error.code === "23505" ? "Nomor atau slug bab sudah dipakai pada novel ini." : "Bab belum dapat diperbarui.");
  if (novel.status === "published") revalidatePublicNovel(novel.slug);
  revalidatePath(`/admin/novels/${parsed.data.novelId}`);
  revalidatePath(`/admin/chapters/${idResult.data}`);
  return { status: "success", message: "Bab diperbarui." };
}

export async function deleteChapterAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!getSupabaseConfig()) return invalid("Supabase belum dikonfigurasi.");
  const parsed = z.object({ id: uuid, confirmation: confirmDelete }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? "Permintaan penghapusan tidak valid.");
  await requireAdmin();
  const supabase = await createClient();
  const { data: chapter, error: chapterError } = await supabase.from("chapters").select("novel_id").eq("id", parsed.data.id).maybeSingle();
  if (chapterError || !chapter) return invalid("Bab tidak ditemukan.");
  const { data: novel } = await supabase.from("novels").select("slug,status").eq("id", chapter.novel_id).maybeSingle();
  const { error } = await supabase.from("chapters").delete().eq("id", parsed.data.id);
  if (error) return invalid("Bab belum dapat dihapus.");
  if (novel?.status === "published") revalidatePublicNovel(novel.slug);
  revalidatePath(`/admin/novels/${chapter.novel_id}`);
  redirect(`/admin/novels/${chapter.novel_id}`);
}

export async function moderateCommentAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!getSupabaseConfig()) return invalid("Supabase belum dikonfigurasi.");
  const parsed = z.object({ id: uuid, status: z.enum(["approved", "rejected"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid("Permintaan moderasi tidak valid.");
  await requireAdmin();
  const supabase = await createClient();
  const { data: comment, error: commentError } = await supabase.from("comments").select("chapter_id").eq("id", parsed.data.id).maybeSingle();
  if (commentError || !comment) return invalid("Komentar tidak ditemukan.");
  const { error } = await supabase.from("comments").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (error) return invalid("Status komentar belum dapat diperbarui.");
  revalidatePath("/admin/comments");
  return { status: "success", message: parsed.data.status === "approved" ? "Komentar disetujui." : "Komentar ditolak." };
}
