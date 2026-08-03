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
    const matchesQuery = novel.title.toLocaleLowerCase("id").includes(query.toLocaleLowerCase("id"));
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
      <div className="ui-card grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:p-5">
        <div>
          <label htmlFor="novel-search" className="text-sm font-extrabold">Cari berdasarkan judul</label>
          <div className="relative mt-2">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 fill-none stroke-[var(--muted)]" strokeWidth="2"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>
            <input id="novel-search" type="search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Misalnya: musim, rumah, perjalanan" className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2 pl-11 pr-4 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none" />
          </div>
        </div>
        <div>
          <label htmlFor="genre-filter" className="text-sm font-extrabold">Pilih suasana</label>
          <select id="genre-filter" value={genre} onChange={(event) => updateGenre(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-semibold focus:border-[var(--accent)] focus:outline-none">
            <option>Semua</option>
            {allGenres.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <p className="text-xs font-semibold text-[var(--muted)] sm:col-span-2">{filteredNovels.length} {filteredNovels.length === 1 ? "cerita ditemukan" : "cerita ditemukan"}</p>
      </div>
      {filteredNovels.length ? (
        <>
          <div className="mt-7 grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filteredNovels.slice(0, visibleCount).map((novel) => <NovelCard key={novel.slug} novel={novel} />)}
          </div>
          {visibleCount < filteredNovels.length && <div className="mt-8 text-center"><button type="button" onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE)} className="ui-button-secondary">Tampilkan cerita lain</button></div>}
        </>
      ) : <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_65%,transparent)] p-8 text-center sm:p-10"><span aria-hidden="true" className="grid mx-auto size-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">⌕</span><p className="mt-4 font-[family-name:var(--font-lora)] text-xl font-bold">Belum ada cerita yang cocok.</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">Coba ganti kata kunci atau pilih suasana cerita yang lain.</p></div>}
    </>
  );
}
