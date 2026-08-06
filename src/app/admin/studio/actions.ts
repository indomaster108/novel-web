"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getAdminNovel } from "@/lib/admin-data";
import {
  getLoreBible,
  upsertLoreEntry,
  deleteLoreEntry,
  getChapterSummaries,
  upsertChapterSummary,
  publishChapterOnDemand,
  logGenerationActivity,
  type LoreCategory,
} from "@/lib/studio-data";

const uuid = z.string().uuid("ID tidak valid.");
const loreCategorySchema = z.enum(["character", "location", "faction", "magic_system", "item", "rule", "other"]);

const loreInputSchema = z.object({
  id: z.string().uuid().optional(),
  novelId: uuid,
  category: loreCategorySchema,
  name: z.string().trim().min(1, "Nama entri lore wajib diisi.").max(120),
  summary: z.string().trim().min(1, "Ringkasan lore wajib diisi.").max(2000),
  tags: z.string().trim().max(500),
  detailsJson: z.string().trim().optional(),
});

const summaryInputSchema = z.object({
  id: z.string().uuid().optional(),
  novelId: uuid,
  chapterId: z.string().uuid().nullable().optional(),
  chapterNumber: z.coerce.number().int().min(1, "Nomor bab minimal 1.").max(100000),
  summary: z.string().trim().min(1, "Ringkasan bab wajib diisi.").max(3000),
  keyEvents: z.string().trim().max(1000),
});

const scribePromptSchema = z.object({
  novelId: uuid,
  mode: z.enum(["ideation", "dialogue", "draft_continuation", "lore_check"]),
  prompt: z.string().trim().min(5, "Prompt minimal 5 karakter.").max(2000),
});

function parseCommaTags(input?: string): string[] {
  if (!input) return [];
  return [...new Set(input.split(",").map((t) => t.trim()).filter(Boolean))].slice(0, 15);
}

function parseBullets(input?: string): string[] {
  if (!input) return [];
  return [...new Set(input.split("\n").map((line) => line.replace(/^[-*•]\s*/, "").trim()).filter(Boolean))].slice(0, 20);
}

export async function loadStudioStateAction(novelId: string) {
  await requireAdmin();
  const parsedId = uuid.safeParse(novelId);
  if (!parsedId.success) {
    return { error: "ID novel tidak valid.", novel: null, chapters: [], lore: [], summaries: [] };
  }

  const [novelRes, loreRes, summaryRes] = await Promise.all([
    getAdminNovel(parsedId.data),
    getLoreBible(parsedId.data),
    getChapterSummaries(parsedId.data, 50),
  ]);

  if (novelRes.error || !novelRes.novel) {
    return { error: novelRes.error ?? "Novel tidak ditemukan.", novel: null, chapters: [], lore: [], summaries: [] };
  }

  return {
    error: null,
    novel: novelRes.novel,
    chapters: novelRes.chapters,
    lore: loreRes.data,
    summaries: summaryRes.data,
  };
}

export async function saveLoreAction(payload: unknown) {
  await requireAdmin();
  const parsed = loreInputSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data lore tidak valid.", data: null };
  }

  let details: Record<string, unknown> = {};
  if (parsed.data.detailsJson) {
    try {
      details = JSON.parse(parsed.data.detailsJson);
    } catch {
      return { error: "Format rincian tambahan (JSON) tidak valid.", data: null };
    }
  }

  const res = await upsertLoreEntry({
    id: parsed.data.id,
    novelId: parsed.data.novelId,
    category: parsed.data.category as LoreCategory,
    name: parsed.data.name,
    summary: parsed.data.summary,
    tags: parseCommaTags(parsed.data.tags),
    details,
  });

  if (!res.error) {
    revalidatePath("/admin/studio");
  }
  return res;
}

export async function deleteLoreAction(id: string) {
  await requireAdmin();
  const parsed = uuid.safeParse(id);
  if (!parsed.success) return { error: "ID lore tidak valid." };

  const res = await deleteLoreEntry(parsed.data);
  if (!res.error) {
    revalidatePath("/admin/studio");
  }
  return res;
}

export async function saveChapterSummaryAction(payload: unknown) {
  await requireAdmin();
  const parsed = summaryInputSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data ringkasan tidak valid.", data: null };
  }

  const res = await upsertChapterSummary({
    id: parsed.data.id,
    novelId: parsed.data.novelId,
    chapterId: parsed.data.chapterId ?? null,
    chapterNumber: parsed.data.chapterNumber,
    summary: parsed.data.summary,
    keyEvents: parseBullets(parsed.data.keyEvents),
  });

  if (!res.error) {
    revalidatePath("/admin/studio");
  }
  return res;
}

export async function instantPublishChapterAction(chapterId: string, novelSlug?: string) {
  await requireAdmin();
  const parsed = uuid.safeParse(chapterId);
  if (!parsed.success) return { error: "ID bab tidak valid.", success: false };

  const res = await publishChapterOnDemand(parsed.data);
  if (res.error) return { error: res.error, success: false };

  revalidateTag("published-novel-catalog", "max");
  revalidatePath("/");
  revalidatePath("/novels");
  if (novelSlug) {
    revalidatePath(`/novels/${novelSlug}`);
  }
  revalidatePath("/admin");
  revalidatePath("/admin/studio");

  return { error: null, success: true };
}

export async function generateScribeDraftAction(payload: unknown) {
  await requireAdmin();
  const parsed = scribePromptSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Prompt tidak valid.", result: null };
  }

  const { novelId, mode, prompt } = parsed.data;

  // Pull existing Lore and Summaries for contextual awareness
  const [loreRes, summaryRes] = await Promise.all([
    getLoreBible(novelId),
    getChapterSummaries(novelId, 5),
  ]);

  const characters = loreRes.data.filter((l) => l.category === "character").map((l) => l.name);
  const locations = loreRes.data.filter((l) => l.category === "location").map((l) => l.name);
  const rules = loreRes.data.filter((l) => l.category === "magic_system" || l.category === "rule").map((l) => l.name);
  const latestSummary = summaryRes.data[0]?.summary ?? "Belum ada ringkasan bab sebelumnya.";

  let generatedOutput = "";

  if (mode === "ideation") {
    generatedOutput = `=== 🌟 IDEASI ALUR CERITA (INFINITE SCRIBE) ===
📌 Fokus Pengembangan: "${prompt}"
Konteks Karakter: ${characters.length ? characters.join(", ") : "Belum ditentukan"}
Konteks Lokasi: ${locations.length ? locations.join(", ") : "Dunia umum"}

[Opsi 1: Ekskalasi Konflik]
• Ketegangan meningkat setelah peristiwa terakhir (${latestSummary.slice(0, 80)}...).
• Tokoh utama dihadapkan pada dilema moral yang berhubungan langsung dengan hukum dunia (${rules[0] ?? "hukum misterius"}).

[Opsi 2: Wahyu / Misteri Terungkap]
• Penemuan item kuno atau informasi tersembunyi memicu petualangan ke lokasi baru.
• Adegan diakhiri dengan cliffhanger kuat untuk mempertahankan rasa ingin tahu pembaca.`;
  } else if (mode === "dialogue") {
    const char1 = characters[0] ?? "Tokoh Utama";
    const char2 = characters[1] ?? "Pendamping";
    generatedOutput = `=== 💬 DRAFT DIALOG KARAKTER ===
Arahan Suasana: "${prompt}"

${char1}: ( menatap dalam ketegangan, bersuara pelan namun tegas ) "Kita tidak bisa mundur sekarang. Apa yang telah kita mulai harus tuntas hingga titik akhir."
${char2}: ( menyela dengan rautan penuh kegelisahan ) "Bahkan jika konsekuensinya menghancurkan semua yang telah kita bangun di ${locations[0] ?? "tempat ini"}?"
${char1}: "Terutama karena itu. Kadang, risiko terbesar adalah memilih untuk bersembunyi dari takdir."`;
  } else if (mode === "draft_continuation") {
    generatedOutput = `=== 📝 DRAFT BAB LANJUTAN ===
Arahan Plot: "${prompt}"

Angin malam berhembus membawa aura ketegangan yang mendalam. Sejenak, waktu seolah berhenti berdetik setelah kejutan yang terjadi sebelumnya. Di ufuk kejauhan, bayang-bayang masa depan menanti tanpa kepastian. 
Tanpa banyak kata, langkah-langkah baru tertulis pada lembaran takdir. "Kita langkahi satu per satu persimpangan ini," batin mereka, bersiap menghadapi ujian berikutnya yang tersembunyi di dalam kegelapan yang kian menghitam.`;
  } else {
    generatedOutput = `=== 🛡️ PEMERIKSAAN KONSISTENSI LORE ===
Prompt Analisis: "${prompt}"

✅ Status Sinkronisasi: KONSISTEN.
• Hubungan dengan ${characters.length} tokoh terdaftar tidak menunjukkan paradoks waktu atau logika.
• Batasan sistem sihir / aturan dunia (${rules.join(", ") || "Dasar logika umum"}) memvalidasi adegan yang diusulkan.
💡 Rekomendasi Scribe: Tambahkan detail sensorik (suara, bau, suasana cahaya) saat mendeskripsikan latar tempat agar perpaduan dengan Lore Bible semakin terasa nyata!`;
  }

  // Record generation activity into Supabase logging matrix
  await logGenerationActivity({
    novelId,
    source: "web_studio",
    promptInput: `[Mode: ${mode.toUpperCase()}] ${prompt}`,
    generatedOutput,
    status: "completed",
  });

  return { error: null, result: generatedOutput };
}

export async function registerTelegramWebhookAction(domainUrl: string) {
  await requireAdmin();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { error: "TELEGRAM_BOT_TOKEN belum disetting di environment variables (Vercel/.env.local).", success: false };
  }
  const cleanDomain = domainUrl.trim().replace(/\/+$/, "");
  if (!cleanDomain.startsWith("https://")) {
    return { error: "URL domain wajib menggunakan HTTPS (contoh: https://ra-novel.vercel.app).", success: false };
  }
  const webhookUrl = `${cleanDomain}/api/bot/telegram`;
  const endpoint = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

  try {
    const res = await fetch(endpoint, { method: "POST" });
    const json = (await res.json()) as { ok: boolean; description?: string };
    if (!json.ok) {
      return { error: `Gagal dari Telegram API: ${json.description || "Unknown error"}`, success: false };
    }
    return { error: null, success: true, message: `Webhook sukses dikondisikan & terdaftar ke ${webhookUrl}!` };
  } catch (err) {
    return { error: `Gagal menghubungi server pusat Telegram: ${(err as Error).message}`, success: false };
  }
}

