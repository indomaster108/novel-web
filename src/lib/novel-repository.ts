import { unstable_cache } from "next/cache";

import { getSupabaseConfig } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { novels as localNovels } from "@/data/novels";
import type { Chapter, Novel } from "@/types/novel";

type CatalogResult<T> = {
  data: T;
  source: "supabase" | "local";
  error: string | null;
};

type NovelRow = {
  id: string;
  title: string;
  slug: string;
  author_name: string;
  synopsis: string | null;
  cover_url: string | null;
  genres: string[];
  status: string;
  chapters: Array<{
    id: string;
    chapter_number: number;
    title: string;
    slug: string;
    content: string;
    status: string;
  }>;
};

function mapChapter(row: NovelRow["chapters"][number]): Chapter {
  const paragraphs = row.content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  return {
    id: row.id,
    number: row.chapter_number,
    slug: row.slug,
    title: row.title,
    excerpt: paragraphs[0]?.slice(0, 180) ?? "",
    paragraphs,
  };
}

function mapNovel(row: NovelRow): Novel {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    author: row.author_name,
    genres: row.genres,
    status: "Terbit",
    synopsis: row.synopsis ?? "Sinopsis belum tersedia.",
    cover: row.cover_url ?? "/covers/rumah-yang-mengingat-nama.svg",
    chapters: row.chapters
      .filter((chapter) => chapter.status === "published")
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map(mapChapter),
  };
}

export async function getNovelCatalog(): Promise<CatalogResult<Novel[]>> {
  if (!getSupabaseConfig()) {
    return { data: localNovels, source: "local", error: null };
  }

  return getCachedSupabaseCatalog();
}

const getCachedSupabaseCatalog = unstable_cache(async (): Promise<CatalogResult<Novel[]>> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("novels")
    .select("id,title,slug,author_name,synopsis,cover_url,genres,status,chapters(id,chapter_number,title,slug,content,status)")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    return { data: [], source: "supabase", error: "Koleksi Supabase belum dapat dimuat." };
  }

  return { data: (data as NovelRow[]).map(mapNovel), source: "supabase", error: null };
}, ["published-novel-catalog-v1"], { revalidate: 300, tags: ["published-novel-catalog"] });

export async function getNovelBySlug(slug: string): Promise<CatalogResult<Novel | null>> {
  const catalog = await getNovelCatalog();
  return { ...catalog, data: catalog.data.find((novel) => novel.slug === slug) ?? null };
}

export async function getChapterBySlug(novelSlug: string, chapterSlug: string) {
  const result = await getNovelBySlug(novelSlug);
  return {
    ...result,
    data: result.data
      ? { novel: result.data, chapter: result.data.chapters.find((item) => item.slug === chapterSlug) ?? null }
      : null,
  };
}
