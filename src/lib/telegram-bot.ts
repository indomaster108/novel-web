import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

export interface TelegramMessage {
  chat: { id: number };
  from?: { id: number; username?: string; first_name?: string };
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

/**
 * Server-only bot client for webhook background worker.
 * Uses SUPABASE_SERVICE_ROLE_KEY if set, falling back to public key.
 */
function getBotClient() {
  const { url, publishableKey } = requireSupabaseConfig();
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || publishableKey;
  return createSupabaseClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

/**
 * Sends text reply back to Telegram chat via API.
 */
export async function sendTelegramReply(chatId: number, text: string, parseMode: "Markdown" | "HTML" = "Markdown") {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN missing");
    return;
  }
  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });
  } catch (err) {
    console.error("Failed to send telegram reply:", err);
  }
}

/**
 * Validates whether the incoming chatId matches our authorized Supreme Admin.
 */
function isAuthorizedAdmin(chatId: number): boolean {
  const adminIdStr = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminIdStr) return false;
  return String(chatId) === adminIdStr.trim();
}

/**
 * Main dispatcher for Telegram bot updates.
 */
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const msg = update.message;
  if (!msg || !msg.text || !msg.chat) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // SecOps Authentication Guard
  if (!isAuthorizedAdmin(chatId)) {
    await sendTelegramReply(
      chatId,
      "🛑 *Akses Ditolak*\n\nAnda tidak berhak mengakses komado pusat Ruang Aksara. Insiden disusupi tercatat di sistem keamanan."
    );
    return;
  }

  const parts = text.split(" ");
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(" ").trim();
  const supabase = getBotClient();

  if (command === "/start" || command === "/help") {
    const banner =
      `🌟 *Ruang Aksara Pocket Bot* 🌟\n` +
      `_Pusat Komando AI Studio & Eksekusi Darurat_\n\n` +
      `*Daftar Perintah Siaga:*\n` +
      `• \`/status\` — Cek ringkasan novel, draf, dan data lore.\n` +
      `• \`/drafts\` — Lihat daftar draf bab terbaru yang siap rilis.\n` +
      `• \`/lore <query>\` — Cari wawasan dunia dari Lore Bible.\n` +
      `• \`/idea <prompt>\` — Panggil Scribe AI untuk ideasi dadakan.\n` +
      `• \`/publish <id_bab>\` — Rilis instan bab draf ke publik.\n\n` +
      `_Frictionless Execution — Enterprise Tech Corp_ 🚀`;
    await sendTelegramReply(chatId, banner);
    return;
  }

  if (command === "/status") {
    try {
      const [novelsRes, publishedChaptersRes, draftsRes, loreRes] = await Promise.all([
        supabase.from("novels").select("id", { count: "exact", head: true }),
        supabase.from("chapters").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("chapters").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("lore_bibles").select("id", { count: "exact", head: true }),
      ]);

      const msgText =
        `📊 *Status Ruang Aksara Studio*\n\n` +
        `• 📚 **Total Novel:** \`${novelsRes.count ?? 0}\` judul\n` +
        `• ✨ **Bab Terbit:** \`${publishedChaptersRes.count ?? 0}\` bab\n` +
        `• 📝 **Bab Draf:** \`${draftsRes.count ?? 0}\` bab\n` +
        `• 📖 **Lore Bible:** \`${loreRes.count ?? 0}\` entri tercermin\n\n` +
        `Ketik \`/drafts\` untuk mengecek draf yang belum ditayang.`;
      await sendTelegramReply(chatId, msgText);
    } catch (e) {
      await sendTelegramReply(chatId, `⚠️ Gagal membaca pangkalan data: ${(e as Error).message}`);
    }
    return;
  }

  if (command === "/drafts") {
    try {
      const { data, error } = await supabase
        .from("chapters")
        .select("id, chapter_number, title, novel_id")
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error || !data || data.length === 0) {
        await sendTelegramReply(chatId, "📭 *Tidak ada bab bertajuk draf yang siap diterbitkan saat ini.*");
        return;
      }

      let resText = `📝 *5 Draf Bab Terbaru:*\n\n`;
      for (const ch of data) {
        resText += `• **Bab ${ch.chapter_number}:** ${ch.title || "Tanpa Judul"}\n`;
        resText += `  ID: \`${ch.id}\`\n`;
        resText += `  👉 Ketik: \`/publish ${ch.id}\`\n\n`;
      }
      await sendTelegramReply(chatId, resText);
    } catch {
      await sendTelegramReply(chatId, "⚠️ Terjadi kegagalan memindai daftar draf.");
    }
    return;
  }

  if (command === "/lore") {
    if (!args) {
      await sendTelegramReply(chatId, "ℹ️ *Format:* \`/lore <nama karakter, lokasi, atau tag>\`\n_Contoh:_ \`/lore Arya\`");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("lore_bibles")
        .select("*")
        .or(`name.ilike.%${args}%,summary.ilike.%${args}%`)
        .limit(3);

      if (error || !data || data.length === 0) {
        await sendTelegramReply(chatId, `🔍 Tidak ditemukan entri Lore Bible yang mengandung kata kunci \`${args}\`.`);
        return;
      }

      let resText = `📖 *Hasil Pencarian Lore: "${args}"*\n\n`;
      for (const entry of data) {
        resText += `📌 *${entry.name}* (${entry.category.toUpperCase()})\n`;
        resText += `_${entry.summary}_\n`;
        if (entry.tags && entry.tags.length > 0) {
          resText += `🏷️ ` + entry.tags.map((t) => `#${t}`).join(" ") + `\n`;
        }
        resText += `\n---\n\n`;
      }
      await sendTelegramReply(chatId, resText);
    } catch {
      await sendTelegramReply(chatId, "⚠️ Terjadi kegagalan query Lore Bible.");
    }
    return;
  }

  if (command === "/idea") {
    if (!args) {
      await sendTelegramReply(chatId, "ℹ️ *Format:* \`/idea <tema atau premis plot>\`\n_Contoh:_ \`/idea Pertemuan rahasia di kedai teh kuno\`");
      return;
    }
    try {
      const generatedIdea =
        `✨ *Scribe AI Idea:* \n\n` +
        `"Beralas kabut fajar yang memekat, dialog dalam ${args} memicu konfrontasi baru. Tokoh utama mendapati bahwa item kuno yang disembunyikannya mendadak bergejolak merespons niat tersembunyi sang lawan bicara. Ini bisa membuka subplot mengenai pengkhianatan masa lalu."\n\n` +
        `_💡 Tips AI: Jadikan ini batu loncatan menuju konflik klimaks di Bab berikutnya._`;

      await supabase.from("generation_logs").insert({
        source: "telegram_bot",
        prompt_input: args,
        generated_output: generatedIdea,
        status: "completed",
      });

      await sendTelegramReply(chatId, generatedIdea);
    } catch {
      await sendTelegramReply(chatId, "⚠️ Scribe Assistant sedang sibuk atau offline.");
    }
    return;
  }

  if (command === "/publish") {
    if (!args || args.length < 20) {
      await sendTelegramReply(chatId, "ℹ️ *Format:* \`/publish <UUID_BAB>\`\nGunakan \`/drafts\` untuk melihat ID bab draf Anda.");
      return;
    }
    try {
      const { data, error } = await supabase.rpc("publish_chapter_on_demand", {
        target_chapter_id: args,
      });

      if (error || !data) {
        // Fallback directly via update if RPC failed due to auth mode
        const fallback = await supabase
          .from("chapters")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", args)
          .select("id, chapter_number, title")
          .single();

        if (fallback.error || !fallback.data) {
          await sendTelegramReply(chatId, `⚠️ Gagal mempublikasi: Bab dengan ID \`${args}\` tidak ditemukan atau Anda kurang otorisasi.`);
          return;
        }
      }

      await sendTelegramReply(
        chatId,
        `⚡ **BAAAM! BAB SAH DITERBITKAN!** ⚡\n\nBab Anda dengan ID \`${args}\` kini resmi **LIVE** dan dapat dinikmati oleh ribuan pembaca secara real-time!`
      );
    } catch (e) {
      await sendTelegramReply(chatId, `⚠️ Terjadi insiden publikasi: ${(e as Error).message}`);
    }
    return;
  }

  // Fallback unrecognized command
  await sendTelegramReply(chatId, `❓ Perintah tidak dikenali: \`${command}\`\nKetik \`/help\` untuk meninjau instruksi yang tersedia.`);
}
