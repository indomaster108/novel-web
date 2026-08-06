/**
 * Ruang Aksara AI Engine (Powered by Google Gemini)
 * Zero-dependency, ultra-fast native fetch client for Gemini API.
 * Supports genre-agnostic idea-to-synopsis transformation and immersive chapter writing.
 */

export interface GeminiResponse {
  error: string | null;
  text: string | null;
}

const DEFAULT_MODEL = "gemini-3.5-flash";

async function callGemini(prompt: string, systemInstruction?: string, model: string = DEFAULT_MODEL): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      error: "GEMINI_API_KEY belum dikonfigurasi di Environment Variables (Vercel/.env.local).",
      text: null,
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.85,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        error: `Gemini API Error (${res.status}): ${errJson.error?.message || res.statusText}`,
        text: null,
      };
    }

    const json = await res.json();
    const generatedText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      return { error: "Gemini merespons tanpa teks naskah yang valid.", text: null };
    }

    return { error: null, text: generatedText };
  } catch (err) {
    return { error: `Gagal menghubungi pelayan Gemini API: ${(err as Error).message}`, text: null };
  }
}

/**
 * Transforms a simple sentence or idea into a rich synopsis, characters, and 15-chapter outline.
 * Automatically detects the genre (Romance, Thriller, Comedy, Mystery, Fantasy, etc.).
 */
export async function generateSynopsisAndOutline(simpleIdea: string): Promise<GeminiResponse> {
  const systemPrompt =
    `Kamu adalah Maestro Penulis Novel Best-Seller & Universe Architect yang sangat piawai merangkai berbagai genre cerita ` +
    `(Romansa Modern, Thriller Psikologis, Horor, Drama Misteri, Komedi, Sci-Fi, Fantasi, maupun Slice of Life).\n\n` +
    `Tugasmu: Ambil ide atau kalimat sederhana dari penulis, deteksi genrenya yang paling memukau dan tepat, lalu ubah menjadi kerangka novel matang bertema mendalam, mengaduk emosi, dan punya alur cerita yang logis namun penuh kejutan.\n\n` +
    `Gunakan format Markdown berstruktur berikut:\n` +
    `# 📚 [Rekomendasi Judul Novel Paling Menggigit]\n` +
    `**🎭 Genre Terdeteksi:** [sebutkan 2-3 kombinasi genre yang paling tepat]\n` +
    `**💡 Premis Inti:** [ringkas dalam 1 kalimat pembakar semangat]\n\n` +
    `## ✨ Sinopsis Resmi (Back-Cover Blurb)\n` +
    `[Tuliskan 3 paragraf sinopsis yang memikat layaknya sampul belakang novel best-seller. Jangan ungkap semua rahasia, gantung rasa ingin tahu pembaca!]\n\n` +
    `## 👥 Tokoh & Dinamika Utama\n` +
    `• **[Nama Tokoh 1]**: [Peran, kepribadian unik, & motivasi/konflik intinya]\n` +
    `• **[Nama Tokoh 2]**: [Peran, dinamika/hubungan dengan tokoh 1]\n` +
    `• **[Latar Tempat / Waktu]**: [Keadaan latar yang memperkuat suasana kisah]\n\n` +
    `## 📋 Rancangan Outline Alur (Bab 1 - 10)\n` +
    `• **Bab 1: [Judul Bab]** — [Ringkasan peristiwa utama di bab ini]\n` +
    `• **Bab 2: [Judul Bab]** — [Ringkasan]\n` +
    `• **Bab 3: [Judul Bab]** — [Ringkasan]\n` +
    `• **Bab 4: [Judul Bab]** — [Ringkasan]\n` +
    `• **Bab 5 (Titik Balik / Turning Point): [Judul Bab]** — [Ringkasan]\n` +
    `• **Bab 6 - 9 (Eskalasi Konflik): [Judul & Ringkasan Singkat]**\n` +
    `• **Bab 10 (Klimaks Babak Pertama): [Judul Bab]** — [Ringkasan ledakan konflik]`;

  const userPrompt = `Ini adalah ide sederhana atau kalimat pemantik yang ingin saya ubah menjadi novel matang dengan banyak bab:\n\n"${simpleIdea}"`;

  return callGemini(userPrompt, systemPrompt);
}

/**
 * Generates a full, immersive chapter narrative from a chapter outline or prompt.
 */
export async function generateChapterWriting(
  novelTitle: string,
  chapterNumber: number,
  promptOrOutline: string,
  existingSynopsisOrLore?: string
): Promise<GeminiResponse> {
  const systemPrompt =
    `Kamu adalah Novelis Profesional Indonesia dengan gaya penunturan sastra yang menghanyutkan, otentik, dan kaya emosi.\n\n` +
    `Tugasmu: Tuliskan NASKAH LENGKAP untuk Bab ${chapterNumber} dari novel "${novelTitle || "Tanpa Judul"}".\n\n` +
    `Pedoman Penulisan:\n` +
    `1. Hindari kalimat klise AI atau repetitif. Gunakan bahasa yang natural, sesuai genre.\n` +
    `2. Bangkitkan imersif sensorik (suara, pencahayaan, aroma, tatapan masa lalu, atau kegelisahan batin).\n` +
    `3. Percakapan/dialog antar karakter wajib terdengar manusiawi, wajar, dan sarat makna bawah sadar (subtext).\n` +
    `4. Akhiri bab ini dengan titik ketegangan, teka-teki, atau keputusan emosional yang bikin penasaran membaca bab berikutnya (cliffhanger / emotional hook).\n` +
    `5. Tulis selengkap-lengkapnya (minimal 6 - 10 paragraf narasi mendetail).`;

  let userPrompt = `Tolong tuliskan naskah lengkap untuk **Bab ${chapterNumber}** dengan arahan plot/outline berikut:\n"${promptOrOutline}"`;
  if (existingSynopsisOrLore) {
    userPrompt += `\n\n=== Referensi Sinopsis & Lore World ===\n${existingSynopsisOrLore}`;
  }

  return callGemini(userPrompt, systemPrompt, "gemini-3.1-pro");
}

/**
 * General purpose generator for flexible studio tasks (dialogue polish, lore analysis, etc).
 */
export async function generateStudioCustomPrompt(mode: string, prompt: string, context?: string): Promise<GeminiResponse> {
  const systemPrompt = `Kamu adalah Asisten Penulis Scribe AI cerdas dari Ruang Aksara untuk meracik novel berbagai genre. Mode eksekusi kamu adalah: ${mode.toUpperCase()}.`;
  let userText = `Arahan Prompt:\n"${prompt}"`;
  if (context) userText += `\n\nKonteks Tambahan:\n${context}`;
  return callGemini(userText, systemPrompt);
}
