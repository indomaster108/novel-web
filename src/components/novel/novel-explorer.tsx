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
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="sr-only" htmlFor="novel-search">Cari judul novel</label>
        <input id="novel-search" type="search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Cari judul novel" className="min-h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm placeholder:text-[var(--muted)]" />
        <label className="sr-only" htmlFor="genre-filter">Filter genre</label>
        <select id="genre-filter" value={genre} onChange={(event) => updateGenre(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold">
          <option>Semua</option>
          {allGenres.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      {filteredNovels.length ? (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filteredNovels.slice(0, visibleCount).map((novel) => <NovelCard key={novel.slug} novel={novel} />)}
          </div>
          {visibleCount < filteredNovels.length && <div className="mt-8 text-center"><button type="button" onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE)} className="min-h-12 rounded-full border border-[var(--border)] px-5 text-sm font-bold hover:border-[var(--accent)] hover:text-[var(--accent)]">Muat lebih banyak</button></div>}
        </>
      ) : <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] p-10 text-center"><p className="font-[family-name:var(--font-lora)] text-xl font-bold">Belum ada cerita yang cocok.</p><p className="mt-2 text-sm text-[var(--muted)]">Coba kata kunci atau genre lain.</p></div>}
    </>
  );
}
