"use client";

import React, { useState, useEffect, useTransition } from "react";
import type { AdminNovel, AdminChapter } from "@/lib/admin-data";
import type { LoreEntry, ChapterSummaryEntry, LoreCategory } from "@/lib/studio-data";
import {
  loadStudioStateAction,
  saveLoreAction,
  deleteLoreAction,
  saveChapterSummaryAction,
  instantPublishChapterAction,
  generateScribeDraftAction,
  registerTelegramWebhookAction,
} from "@/app/admin/studio/actions";

const loreCategoryLabels: Record<LoreCategory | "all", string> = {
  all: "Semua",
  character: "Karakter",
  location: "Lokasi",
  faction: "Faksi",
  magic_system: "Sistem Sihir",
  item: "Item / Relik",
  rule: "Aturan Dunia",
  other: "Lainnya",
};

const categoryBadgeStyles: Record<LoreCategory, string> = {
  character: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  location: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  faction: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  magic_system: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  item: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  rule: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  other: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
};

export function StudioClient({ initialNovels }: { initialNovels: AdminNovel[] }) {
  const [selectedNovelId, setSelectedNovelId] = useState<string>(initialNovels[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<"scribe" | "lore" | "summaries" | "publish">("scribe");
  
  // Studio loaded datasets
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [loreEntries, setLoreEntries] = useState<LoreEntry[]>([]);
  const [summaries, setSummaries] = useState<ChapterSummaryEntry[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(initialNovels[0]?.id));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Scribe AI State
  const [scribeMode, setScribeMode] = useState<"idea_to_synopsis" | "write_chapter" | "ideation" | "dialogue" | "draft_continuation" | "lore_check">("idea_to_synopsis");
  const [scribePrompt, setScribePrompt] = useState("");
  const [generatedResult, setGeneratedResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Lore Bible Filter & Edit Form State
  const [loreFilter, setLoreFilter] = useState<LoreCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingLore, setIsEditingLore] = useState(false);
  const [loreForm, setLoreForm] = useState<{ id?: string; category: LoreCategory; name: string; summary: string; tags: string }>({
    category: "character",
    name: "",
    summary: "",
    tags: "",
  });

  // Chapter Summary Form State
  const [summaryForm, setSummaryForm] = useState<{ id?: string; chapterId?: string; chapterNumber: number; summary: string; keyEvents: string }>({
    chapterNumber: 1,
    summary: "",
    keyEvents: "",
  });

  // Telegram Bot Webhook Integration State
  const [telegramDomain, setTelegramDomain] = useState("https://ra-novel.vercel.app");
  const [isRegisteringWebhook, setIsRegisteringWebhook] = useState(false);

  const currentNovel = initialNovels.find((n) => n.id === selectedNovelId);

  // Load state when novel changes
  useEffect(() => {
    if (!selectedNovelId) return;
    let isMounted = true;
    loadStudioStateAction(selectedNovelId)
      .then((res) => {
        if (!isMounted) return;
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setChapters(res.chapters);
          setLoreEntries(res.lore);
          setSummaries(res.summaries);
          const maxNum = res.chapters.length ? Math.max(...res.chapters.map((c) => c.chapterNumber)) : 1;
          setSummaryForm((prev) => ({ ...prev, chapterNumber: maxNum }));
        }
      })
      .catch(() => {
        if (isMounted) setErrorMsg("Gagal memuat rincian dari server.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, [selectedNovelId]);

  function showTemporarySuccess(text: string) {
    setSuccessMsg(text);
    setTimeout(() => setSuccessMsg((curr) => (curr === text ? null : curr)), 4000);
  }

  function handleRefresh() {
    if (!selectedNovelId) return;
    setIsLoading(true);
    loadStudioStateAction(selectedNovelId).then((res) => {
      if (!res.error) {
        setChapters(res.chapters);
        setLoreEntries(res.lore);
        setSummaries(res.summaries);
        showTemporarySuccess("Data berhasil diperbarui!");
      }
      setIsLoading(false);
    });
  }

  async function handleRegisterWebhook() {
    setIsRegisteringWebhook(true);
    setErrorMsg(null);
    try {
      const res = await registerTelegramWebhookAction(telegramDomain);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        showTemporarySuccess(res.message ?? "Webhook sukses didaftarkan!");
      }
    } catch {
      setErrorMsg("Gagal mendaftarkan webhook ke Telegram.");
    } finally {
      setIsRegisteringWebhook(false);
    }
  }

  // --- HANDLERS ---
  async function handleScribeGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedNovelId || !scribePrompt.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);

    const res = await generateScribeDraftAction({
      novelId: selectedNovelId,
      mode: scribeMode,
      prompt: scribePrompt,
    });

    if (res.error || !res.result) {
      setErrorMsg(res.error ?? "Gagal memproses AI generator.");
    } else {
      setGeneratedResult(res.result);
      showTemporarySuccess("Scribe berhasil menghasilkan draft baru!");
    }
    setIsGenerating(false);
  }

  function handleSaveLore(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedNovelId) return;
    startTransition(async () => {
      setErrorMsg(null);
      const res = await saveLoreAction({
        id: loreForm.id,
        novelId: selectedNovelId,
        category: loreForm.category,
        name: loreForm.name,
        summary: loreForm.summary,
        tags: loreForm.tags,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        showTemporarySuccess(loreForm.id ? "Entri Lore berhasil diperbarui!" : "Entri Lore baru berhasil disimpan!");
        setIsEditingLore(false);
        setLoreForm({ category: "character", name: "", summary: "", tags: "" });
        handleRefresh();
      }
    });
  }

  function handleDeleteLore(id: string) {
    if (!window.confirm("Yakin ingin menghapus entri lore ini secara permanen?")) return;
    startTransition(async () => {
      const res = await deleteLoreAction(id);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        showTemporarySuccess("Entri Lore berhasil dihapus.");
        handleRefresh();
      }
    });
  }

  function handleSaveSummary(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedNovelId) return;
    startTransition(async () => {
      setErrorMsg(null);
      const targetChapter = chapters.find((c) => c.chapterNumber === Number(summaryForm.chapterNumber));
      const res = await saveChapterSummaryAction({
        id: summaryForm.id,
        novelId: selectedNovelId,
        chapterId: targetChapter?.id ?? null,
        chapterNumber: Number(summaryForm.chapterNumber),
        summary: summaryForm.summary,
        keyEvents: summaryForm.keyEvents,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        showTemporarySuccess(`Ringkasan untuk Bab ${summaryForm.chapterNumber} berhasil disimpan!`);
        setSummaryForm({ chapterNumber: (Number(summaryForm.chapterNumber) || 1) + 1, summary: "", keyEvents: "" });
        handleRefresh();
      }
    });
  }

  function handleInstantPublish(chapterId: string) {
    if (!window.confirm("Menerbitkan bab ini secara instan ke publik sekarang?")) return;
    startTransition(async () => {
      const res = await instantPublishChapterAction(chapterId, currentNovel?.slug);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        showTemporarySuccess("🚀 Bab berhasil dipublikasikan seketika tanpa downtime!");
        handleRefresh();
      }
    });
  }

  const filteredLore = loreEntries.filter((entry) => {
    const matchesCategory = loreFilter === "all" || entry.category === loreFilter;
    const matchesSearch = !searchQuery.trim() || entry.name.toLowerCase().includes(searchQuery.toLowerCase()) || entry.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="page-shell py-6 sm:py-10">
      {/* 🚀 HERO SECTION WITH GLASSMORPHISM & ENTERPRISE PRESTIGE */}
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-r from-[var(--accent-strong)] via-[var(--accent)] to-[#154637] p-6 text-white shadow-[var(--shadow-raised)] sm:p-10">
        <div aria-hidden="true" className="absolute -right-20 -top-20 -z-10 size-80 rounded-full bg-gradient-to-br from-[var(--highlight)]/30 to-transparent blur-3xl" />
        <div aria-hidden="true" className="absolute -left-16 bottom-0 -z-10 size-64 rounded-full bg-white/10 blur-2xl" />
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="glass-badge inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-extrabold tracking-widest uppercase text-white/90">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Ruang Kerja Tahap 2 • AI &amp; Worldbuilding
            </span>
            <h1 className="mt-3 font-[family-name:var(--font-lora)] text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Infinite Scribe Studio
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              Pusat komando terintegrasi untuk menyusun Lore Bible, mengamankan konsistensi alur cerita, bereksperimen dengan Scribe Assistant, serta publikasi instan 1-klik.
            </p>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
            <label htmlFor="novel-selector" className="text-xs font-extrabold uppercase text-white/70">
              Pilih Novel Aktif
            </label>
            {initialNovels.length > 0 ? (
              <select
                id="novel-selector"
                value={selectedNovelId}
                onChange={(e) => {
                  setSelectedNovelId(e.target.value);
                  setIsLoading(true);
                  setErrorMsg(null);
                }}
                className="rounded-xl border border-white/20 bg-black/30 px-4 py-2.5 font-extrabold text-white shadow-sm backdrop-blur-md transition focus:border-white focus:outline-none"
              >
                {initialNovels.map((novel) => (
                  <option key={novel.id} value={novel.id} className="bg-zinc-900 text-white">
                    {novel.title} ({novel.chapterCount} Bab)
                  </option>
                ))}
              </select>
            ) : (
              <span className="rounded-xl bg-red-500/20 px-3 py-2 text-xs font-bold text-red-200">
                Belum ada novel. Silakan buat novel terlebih dahulu di menu Admin.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {errorMsg && (
        <div role="alert" className="mt-4 animate-fade-in rounded-xl border border-[var(--danger)]/30 bg-red-500/10 p-4 text-sm font-bold text-[var(--danger)]">
          ⚠️ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div role="status" className="mt-4 animate-fade-in rounded-xl border border-[var(--success)]/30 bg-emerald-500/15 p-4 text-sm font-bold text-emerald-700 dark:text-emerald-300">
          ✨ {successMsg}
        </div>
      )}

      {/* TABS NAVIGATION BAR */}
      <nav aria-label="Menu Studio" className="mt-8 flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
        {[
          { id: "scribe", label: "🌟 Scribe Assistant", desc: "Drafting & Ideasi AI" },
          { id: "lore", label: `📖 Lore Bible (${loreEntries.length})`, desc: "Dunia & Karakter" },
          { id: "summaries", label: `📜 Rantai Ringkasan (${summaries.length})`, desc: "Alur & Memori" },
          { id: "publish", label: "⚡ 1-Klik Terbit Instan", desc: "Kontrol Publikasi" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              type="button"
              className={`group flex flex-col items-start rounded-2xl px-4 py-2.5 transition duration-200 ${
                isActive
                  ? "bg-[var(--accent)] text-white shadow-[0_10px_20px_color-mix(in_srgb,var(--accent)_22%,transparent)]"
                  : "ui-card hover:border-[var(--accent)] text-[var(--foreground)]"
              }`}
            >
              <span className="text-sm font-bold">{tab.label}</span>
              <span className={`text-xs font-medium transition ${isActive ? "text-white/80" : "text-[var(--muted)] group-hover:text-[var(--foreground)]"}`}>
                {tab.desc}
              </span>
            </button>
          );
        })}
      </nav>

      {/* LOADER */}
      {isLoading && (
        <div className="my-12 flex flex-col items-center justify-center text-[var(--muted)]">
          <span className="size-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--accent)]" />
          <p className="mt-3 text-sm font-extrabold animate-pulse">Menghubungkan ke pangkalan data studio...</p>
        </div>
      )}

      {/* ========================================================
          TAB 1: 🌟 SCRIBE AI ASSISTANT
         ======================================================== */}
      {!isLoading && activeTab === "scribe" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-12 animate-fade-in">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="ui-card p-6">
              <h2 className="font-[family-name:var(--font-lora)] text-xl font-bold text-[var(--foreground)]">
                Konsolidasi Konteks Cerita
              </h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Scribe Assistant secara dinamis menarik wawasan dari Lore Bible dan Ringkasan Bab sebelum merespons prompt Anda.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-center">
                  <p className="text-xs font-bold text-[var(--muted)]">Total Lore Aktif</p>
                  <p className="mt-1 font-[family-name:var(--font-lora)] text-2xl font-extrabold text-[var(--accent)]">{loreEntries.length}</p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-center">
                  <p className="text-xs font-bold text-[var(--muted)]">Memori Bab</p>
                  <p className="mt-1 font-[family-name:var(--font-lora)] text-2xl font-extrabold text-[var(--highlight)]">{summaries.length}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleScribeGenerate} className="ui-card flex flex-col gap-4 p-6">
              <h3 className="font-[family-name:var(--font-lora)] text-lg font-bold text-[var(--foreground)]">
                ⚙️ Parameter Generator
              </h3>
              
              <div>
                <label htmlFor="scribe-mode" className="text-xs font-bold text-[var(--muted)] uppercase">
                  Mode Operasi Scribe
                </label>
                <select
                  id="scribe-mode"
                  value={scribeMode}
                  onChange={(e) => setScribeMode(e.target.value as typeof scribeMode)}
                  className="auth-input mt-1.5 font-bold"
                >
                  <option value="idea_to_synopsis">✨ Ide Sederhana ➔ Sinopsis &amp; Outline Novel (Gemini AI)</option>
                  <option value="write_chapter">📖 Tulis Naskah Bab Novel Lengkap (Gemini AI)</option>
                  <option value="ideation">🌟 Ideasi &amp; Eksplorasi Alur Cerita (Semua Genre)</option>
                  <option value="dialogue">💬 Pengembangan Dialog &amp; Interaksi Tokoh</option>
                  <option value="lore_check">🛡️ Pemeriksaan Konsistensi &amp; Sinkronisasi Lore</option>
                </select>
              </div>

              <div>
                <label htmlFor="scribe-prompt" className="text-xs font-bold text-[var(--muted)] uppercase">
                  Instruksi / Prompt Kepada Scribe
                </label>
                <textarea
                  id="scribe-prompt"
                  rows={4}
                  value={scribePrompt}
                  onChange={(e) => setScribePrompt(e.target.value)}
                  placeholder="Contoh: Seorang barista menemukan surat cinta tua dari tahun 1980 di kafe sepi, lalu berniat mencarikan pemiliknya..."
                  className="auth-input mt-1.5 min-h-[7rem] resize-y py-3 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating || !selectedNovelId}
                className="ui-button mt-2 w-full justify-center gap-2 font-extrabold"
              >
                {isGenerating ? "⏳ Gemini AI Sedang Berpikir..." : "✦ Hasilkan dengan Gemini AI"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <div className="ui-card flex flex-1 flex-col p-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <h3 className="font-[family-name:var(--font-lora)] text-xl font-bold text-[var(--foreground)]">
                  Output Scribe Assistant
                </h3>
                {generatedResult && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedResult);
                      showTemporarySuccess("Teks berhasil disalin ke clipboard!");
                    }}
                    className="rounded-lg bg-[var(--surface-2)] px-3 py-1.5 text-xs font-extrabold text-[var(--accent)] hover:bg-[var(--border)]"
                  >
                    📋 Salin Hasil
                  </button>
                )}
              </div>

              <div className="mt-4 flex-1 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap text-[var(--foreground)]">
                {generatedResult || (
                  <span className="text-[var(--muted)] italic">
                    Belum ada draft yang dihasilkan. Tentukan mode operasi dan kirim instruksi pada panel di sebelah kiri untuk menguji kemampuan Scribe Assistant.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: 📖 LORE BIBLE
         ======================================================== */}
      {!isLoading && activeTab === "lore" && (
        <div className="mt-6 flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {(Object.keys(loreCategoryLabels) as (LoreCategory | "all")[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setLoreFilter(cat)}
                  type="button"
                  className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                    loreFilter === cat
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                  }`}
                >
                  {loreCategoryLabels[cat]}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari lore..."
                className="auth-input m-0 min-h-[2.5rem] w-full sm:w-56 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  setLoreForm({ category: "character", name: "", summary: "", tags: "" });
                  setIsEditingLore(!isEditingLore);
                }}
                className="ui-button m-0 min-h-[2.5rem] px-4 py-2 text-xs font-extrabold shrink-0"
              >
                {isEditingLore ? "✕ Tutup Formulir" : "＋ Entri Lore Baru"}
              </button>
            </div>
          </div>

          {isEditingLore && (
            <form onSubmit={handleSaveLore} className="ui-card border-2 border-[var(--accent)] bg-[var(--surface-2)]/30 p-6 shadow-lg animate-fade-in">
              <h3 className="font-[family-name:var(--font-lora)] text-lg font-bold text-[var(--foreground)]">
                {loreForm.id ? "✏️ Perbarui Entri Lore" : "✨ Tambah Entri Lore Baru"}
              </h3>
              
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="lore-category" className="text-xs font-bold text-[var(--muted)] uppercase">Kategori</label>
                  <select
                    id="lore-category"
                    value={loreForm.category}
                    onChange={(e) => setLoreForm((p) => ({ ...p, category: e.target.value as LoreCategory }))}
                    className="auth-input mt-1 font-bold text-sm"
                  >
                    {Object.entries(loreCategoryLabels).filter(([k]) => k !== "all").map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="lore-name" className="text-xs font-bold text-[var(--muted)] uppercase">Nama Entri</label>
                  <input
                    id="lore-name"
                    type="text"
                    value={loreForm.name}
                    onChange={(e) => setLoreForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Contoh: Kapten Narendra / Pedang Cahaya"
                    className="auth-input mt-1 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="lore-summary" className="text-xs font-bold text-[var(--muted)] uppercase">Ringkasan &amp; Aturan Utama</label>
                <textarea
                  id="lore-summary"
                  rows={3}
                  value={loreForm.summary}
                  onChange={(e) => setLoreForm((p) => ({ ...p, summary: e.target.value }))}
                  placeholder="Jelaskan peran, kepribadian, latar belakang, atau hukum fisis dari entri ini..."
                  className="auth-input mt-1 min-h-[5rem] resize-y py-2 text-sm"
                  required
                />
              </div>

              <div className="mt-4">
                <label htmlFor="lore-tags" className="text-xs font-bold text-[var(--muted)] uppercase">Tag (Pisahkan dengan koma)</label>
                <input
                  id="lore-tags"
                  type="text"
                  value={loreForm.tags}
                  onChange={(e) => setLoreForm((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="protagonis, bab-1, sihir-kristal"
                  className="auth-input mt-1 text-sm"
                />
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingLore(false)}
                  className="ui-button-secondary text-xs min-h-[2.5rem] px-4"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="ui-button text-xs min-h-[2.5rem] px-5 font-extrabold"
                >
                  {isPending ? "Menyimpan..." : "💾 Simpan Entri Lore"}
                </button>
              </div>
            </form>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLore.length > 0 ? (
              filteredLore.map((entry) => (
                <article key={entry.id} className="ui-card flex flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${categoryBadgeStyles[entry.category] || categoryBadgeStyles.other}`}>
                        {loreCategoryLabels[entry.category] || entry.category}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setLoreForm({
                              id: entry.id,
                              category: entry.category,
                              name: entry.name,
                              summary: entry.summary,
                              tags: entry.tags.join(", "),
                            });
                            setIsEditingLore(true);
                            window.scrollTo({ top: 150, behavior: "smooth" });
                          }}
                          className="rounded p-1 text-xs text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] font-extrabold"
                          title="Edit entri"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLore(entry.id)}
                          className="rounded p-1 text-xs text-[var(--muted)] hover:bg-red-500/10 hover:text-[var(--danger)] font-extrabold"
                          title="Hapus entri"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <h4 className="mt-3 font-[family-name:var(--font-lora)] text-lg font-bold text-[var(--foreground)]">
                      {entry.name}
                    </h4>
                    <p className="mt-2 text-xs leading-5 text-[var(--muted)] line-clamp-4">
                      {entry.summary}
                    </p>
                  </div>

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1 border-t border-[var(--border)]/60 pt-3">
                      {entry.tags.map((t) => (
                        <span key={t} className="rounded-md bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-[var(--border)] p-12 text-center text-[var(--muted)]">
                <p className="text-sm font-bold">Tidak ada entri lore yang cocok dengan filter saat ini.</p>
                <p className="mt-1 text-xs">Klik tombol &quot;＋ Entri Lore Baru&quot; di atas untuk membangun pangkalan data dunia cerita Anda!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: 📜 RANTAI RINGKASAN BAB (MEMORY CHAIN)
         ======================================================== */}
      {!isLoading && activeTab === "summaries" && (
        <div className="mt-6 grid gap-8 lg:grid-cols-12 animate-fade-in">
          <form onSubmit={handleSaveSummary} className="ui-card lg:col-span-5 flex flex-col gap-4 p-6 h-fit">
            <h3 className="font-[family-name:var(--font-lora)] text-lg font-bold text-[var(--foreground)]">
              📌 Rekam Ringkasan Bab Baru
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Rantai memori ini menjaga agar Scribe AI mengetahui urutan waktu dan peristiwa penting di setiap bab.
            </p>

            <div>
              <label htmlFor="summary-chapter-num" className="text-xs font-bold text-[var(--muted)] uppercase">Nomor Bab</label>
              <input
                id="summary-chapter-num"
                type="number"
                min="1"
                max="10000"
                value={summaryForm.chapterNumber}
                onChange={(e) => setSummaryForm((p) => ({ ...p, chapterNumber: parseInt(e.target.value, 10) || 1 }))}
                className="auth-input mt-1 font-bold w-32"
                required
              />
            </div>

            <div>
              <label htmlFor="summary-text" className="text-xs font-bold text-[var(--muted)] uppercase">Ringkasan Utama Bab</label>
              <textarea
                id="summary-text"
                rows={3}
                value={summaryForm.summary}
                onChange={(e) => setSummaryForm((p) => ({ ...p, summary: e.target.value }))}
                placeholder="Contoh: Narendra menyelinap ke dalam gerbang benteng barat dan berhasil mengungkap konspirasi penasihat kerajaan."
                className="auth-input mt-1 min-h-[5rem] resize-y py-2 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="summary-events" className="text-xs font-bold text-[var(--muted)] uppercase">Peristiwa / Poin Penting (1 baris 1 poin)</label>
              <textarea
                id="summary-events"
                rows={3}
                value={summaryForm.keyEvents}
                onChange={(e) => setSummaryForm((p) => ({ ...p, keyEvents: e.target.value }))}
                placeholder="- Narendra menemukan peta rahasia&#10;- Pedang Cahaya aktif pertama kali&#10;- Pertempuran sengit di jembatan atas"
                className="auth-input mt-1 min-h-[5rem] resize-y py-2 font-mono text-xs"
              />
            </div>

            <button type="submit" disabled={isPending || !selectedNovelId} className="ui-button mt-2 w-full justify-center font-extrabold">
              {isPending ? "Menyimpan..." : "💾 Rekam ke Rantai Memori"}
            </button>
          </form>

          <div className="lg:col-span-7 flex flex-col gap-4">
            <h3 className="font-[family-name:var(--font-lora)] text-xl font-bold text-[var(--foreground)]">
              ⏳ Garis Waktu Kronologi Cerita
            </h3>
            {summaries.length > 0 ? (
              <div className="relative border-l-2 border-[var(--accent)]/40 pl-6 ml-3 flex flex-col gap-6">
                {summaries.map((sum) => (
                  <div key={sum.id} className="relative group">
                    <span className="absolute -left-[31px] top-1 grid size-4 place-items-center rounded-full bg-[var(--accent)] ring-4 ring-[var(--background)] transition group-hover:scale-125" />
                    <article className="ui-card p-5 transition hover:shadow-[var(--shadow)]">
                      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <span className="font-extrabold text-sm text-[var(--accent)]">
                          BAB #{sum.chapterNumber}
                        </span>
                        {sum.createdAt && (
                          <time className="text-[11px] font-medium text-[var(--muted)]">
                            {new Date(sum.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </time>
                        )}
                      </div>
                      <p className="mt-3 text-xs font-medium leading-relaxed text-[var(--foreground)]">
                        {sum.summary}
                      </p>
                      {sum.keyEvents && sum.keyEvents.length > 0 && (
                        <ul className="mt-3 space-y-1 rounded-xl bg-[var(--background)] p-3 text-xs text-[var(--muted)]">
                          {sum.keyEvents.map((evt, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-[var(--accent)] font-bold">▹</span>
                              <span>{evt}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center text-[var(--muted)]">
                <p className="text-sm font-bold">Belum ada rantai ringkasan tersimpan.</p>
                <p className="mt-1 text-xs">Gunakan formulir di sebelah kiri untuk merekam jejak perjalanan bab per bab!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: ⚡ 1-CLICK INSTANT PUBLISHER CONSOLE
         ======================================================== */}
      {!isLoading && activeTab === "publish" && (
        <div className="mt-6 animate-fade-in">
          {/* TELEGRAM WEBHOOK CONFIG CARD */}
          <div className="ui-card mb-6 p-6 border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 to-[var(--surface-2)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
                  🤖 Tahap 3 • Scribe Bot Skuadron
                </span>
                <h3 className="mt-2 font-[family-name:var(--font-lora)] text-xl font-bold text-[var(--foreground)]">
                  Hubungkan Webhook Telegram Pocket Bot
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)] max-w-xl">
                  Daftarkan domain produksi Anda agar Telegram dapat langsung menembak API <code className="text-indigo-400 font-mono">/api/bot/telegram</code> saat Anda mengirim perintah <code className="font-mono">/publish</code>, <code className="font-mono">/lore</code>, atau <code className="font-mono">/idea</code> dari HP.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={telegramDomain}
                  onChange={(e) => setTelegramDomain(e.target.value)}
                  placeholder="https://ra-novel.vercel.app"
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 text-xs font-mono font-bold text-[var(--foreground)] focus:border-indigo-500 focus:outline-none w-full sm:w-64"
                />
                <button
                  type="button"
                  onClick={handleRegisterWebhook}
                  disabled={isRegisteringWebhook || isPending}
                  className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-extrabold text-white shadow-md transition disabled:opacity-50"
                >
                  {isRegisteringWebhook ? "Mendaftarkan..." : "🔗 Aktifkan Webhook"}
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-indigo-500/20 pt-3 text-[11px] text-[var(--muted)]">
              <span>💡 <strong>Tips SecOps:</strong> Pastikan Anda telah menambah <code className="bg-[var(--surface-2)] px-1.5 py-0.5 rounded text-[var(--foreground)]">TELEGRAM_BOT_TOKEN</code> dan <code className="bg-[var(--surface-2)] px-1.5 py-0.5 rounded text-[var(--foreground)]">TELEGRAM_ADMIN_CHAT_ID</code> di Environment Variables Vercel!</span>
            </div>
          </div>

          <div className="ui-card mb-6 p-6 bg-gradient-to-r from-[var(--surface)] to-[var(--surface-2)]">
            <h2 className="font-[family-name:var(--font-lora)] text-xl font-bold text-[var(--foreground)]">
              🚀 1-Click Instant Publishing Console
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Teknologi perilisan tanpa hambatan. Pilih bab yang masih berstatus draft untuk menerbitkannya seketika tanpa perlu build ulang di Vercel atau menunggu deployment.
            </p>
          </div>

          <div className="ui-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] font-extrabold uppercase tracking-wider text-[var(--muted)]">
                  <tr>
                    <th scope="col" className="p-4">No.</th>
                    <th scope="col" className="p-4">Judul Bab</th>
                    <th scope="col" className="p-4">Slug</th>
                    <th scope="col" className="p-4">Status Saat Ini</th>
                    <th scope="col" className="p-4 text-right">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {chapters.length > 0 ? (
                    chapters.map((ch) => {
                      const isPub = ch.status === "published";
                      return (
                        <tr key={ch.id} className="transition hover:bg-[var(--surface-2)]/40">
                          <td className="p-4 font-bold text-[var(--foreground)]">Bab {ch.chapterNumber}</td>
                          <td className="p-4 font-[family-name:var(--font-lora)] font-bold text-[var(--foreground)]">{ch.title}</td>
                          <td className="p-4 font-mono text-[var(--muted)]">{ch.slug}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                              isPub
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                            }`}>
                              {isPub ? "● Diterbitkan" : "○ Draft"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {!isPub ? (
                              <button
                                type="button"
                                onClick={() => handleInstantPublish(ch.id)}
                                disabled={isPending}
                                className="inline-flex min-h-[2.2rem] items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 text-[11px] font-extrabold text-white shadow-md transition hover:scale-105 hover:shadow-lg disabled:opacity-50"
                              >
                                <span>🚀 Terbitkan 1-Klik</span>
                              </button>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                ✓ Siap Dibaca Publik
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-sm font-bold text-[var(--muted)]">
                        Belum ada bab untuk novel yang dipilih ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
