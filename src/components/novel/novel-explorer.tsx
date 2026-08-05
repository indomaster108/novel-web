"use client";

import { useMemo, useState } from "react";
import { NovelCard } from "@/components/novel/novel-card";
import type { Novel } from "@/types/novel";

const INITIAL_VISIBLE = 4;

export function NovelExplorer({ novels }: { novels: Novel[] }) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("Semua");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const allGenres = useMemo(() => Array.from(new Set(novels.flatMap((novel) => novel.genres))), [novels]);
  
  const filteredNovels = useMemo(() => novels.filter((novel) => {
    const matchesQuery = novel.title.toLocaleLowerCase("id").includes(query.toLocaleLowerCase("id")) || 
                         novel.author.toLocaleLowerCase("id").includes(query.toLocaleLowerCase("id"));
    const matchesGenre = genre === "Semua" || novel.genres.includes(genre);
    return matchesQuery && matchesGenre;
  }), [genre, novels, query]);

  function updateQuery(value: string) {
    setQuery(value);
    setVisibleCount(INITIAL_VISIBLE);
  }

  function updateGenre(value: string) {
    setGenre(value);
    setVisibleCount(INITIAL_VISIBLE);
  }

  return (
    <>
      <div className="ui-card transition-shadow duration-300 hover:shadow-[0_16px_40px_rgb(37_47_40_/_10%)] grid gap-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_13rem] sm:items-end">
          <div>
            <label htmlFor="novel-search" className="text-sm font-extrabold flex items-center gap-1.5 text-[var(--foreground)]">
              <span>🔍 Cari Judul atau Penulis</span>
            </label>
            <div className="relative mt-2">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 fill-none stroke-[var(--muted)] transition-colors duration-200 group-focus-within:stroke-[var(--accent)]" strokeWidth="2.2"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>
              <input 
                id="novel-search" 
                type="search" 
                value={query} 
                onChange={(event) => updateQuery(event.target.value)} 
                placeholder="Ketik judul novel atau nama penulis..." 
                className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 pl-11 pr-4 text-sm font-semibold placeholder:text-[var(--muted)] transition-all duration-200 focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/15" 
              />
            </div>
          </div>
          <div>
            <label htmlFor="genre-filter" className="text-sm font-extrabold text-[var(--foreground)]">Suasana Cerita</label>
            <select 
              id="genre-filter" 
              value={genre} 
              onChange={(event) => updateGenre(event.target.value)} 
              className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-bold transition-all duration-200 focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/15"
            >
              <option value="Semua">📚 Semua Genre ({novels.length})</option>
              {allGenres.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>

        {/* Interactive Fast-Filter Genre Chips */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)] mr-1">Filter Cepat:</span>
          <button
            type="button"
            onClick={() => updateGenre("Semua")}
            className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition-all duration-200 ${genre === "Semua" ? "bg-[var(--accent)] text-white shadow-[0_4px_12px_color-mix(in_srgb,var(--accent)_30%,transparent)] scale-105" : "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"}`}
          >
            Semua
          </button>
          {allGenres.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => updateGenre(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition-all duration-200 ${genre === item ? "bg-[var(--accent)] text-white shadow-[0_4px_12px_color-mix(in_srgb,var(--accent)_30%,transparent)] scale-105" : "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)]/60 pt-2 text-xs font-bold text-[var(--muted)]">
          <span>✨ Menampilkan <strong className="text-[var(--foreground)]">{filteredNovels.length}</strong> dari <strong className="text-[var(--foreground)]">{novels.length}</strong> novel terdaftar</span>
          {query && <button type="button" onClick={() => updateQuery("")} className="text-[var(--accent)] hover:underline">Hapus pencarian</button>}
        </div>
      </div>

      {filteredNovels.length ? (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 min-[390px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filteredNovels.slice(0, visibleCount).map((novel) => (
              <div key={novel.slug} className="h-full">
                <NovelCard novel={novel} />
              </div>
            ))}
          </div>
          {visibleCount < filteredNovels.length && (
            <div className="mt-10 text-center">
              <button 
                type="button" 
                onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE)} 
                className="ui-button-secondary inline-flex items-center gap-2 px-8 py-3 text-base shadow-[0_8px_20px_rgb(0_0_0_/_6%)] hover:shadow-md"
              >
                <span>📖 Tampilkan lebih banyak cerita ({filteredNovels.length - visibleCount} tersisa)</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_65%,transparent)] p-10 text-center animate-fade-in shadow-sm">
          <span aria-hidden="true" className="grid mx-auto size-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-2xl text-[var(--accent)] shadow-inner">⌕</span>
          <p className="mt-5 font-[family-name:var(--font-lora)] text-2xl font-bold text-[var(--foreground)]">Belum ada cerita yang cocok.</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Coba gunakan kata kunci lain atau matikan filter genre untuk menjelahi seluruh koleksi novel kami.</p>
          <button 
            type="button" 
            onClick={() => { updateQuery(""); updateGenre("Semua"); }} 
            className="ui-button mt-6 inline-flex items-center gap-2 text-xs"
          >
            🔄 Reset Semua Filter
          </button>
        </div>
      )}
    </>
  );
}
