import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getNovelCatalog } from "@/lib/novel-repository";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> { const { data: novels } = await getNovelCatalog(); return [{ url: siteUrl, changeFrequency: "weekly", priority: 1 }, { url: `${siteUrl}/novels`, changeFrequency: "weekly", priority: 0.9 }, ...novels.flatMap((novel) => [{ url: `${siteUrl}/novels/${novel.slug}`, changeFrequency: "weekly" as const, priority: 0.8 }, ...novel.chapters.map((chapter) => ({ url: `${siteUrl}/read/${novel.slug}/${chapter.slug}`, changeFrequency: "monthly" as const, priority: 0.6 }))])]; }
