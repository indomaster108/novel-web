import Image from "next/image";
import Link from "next/link";
import type { Novel } from "@/types/novel";

export function NovelCard({ novel }: { novel: Novel }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[var(--shadow)]">
      <Link href={`/novels/${novel.slug}`} className="block">
        <Image src={novel.cover} alt={`Sampul ${novel.title}`} width={720} height={960} className="aspect-[3/4] w-full object-cover" />
        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {novel.genres.map((genre) => <span key={genre} className="rounded-full bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">{genre}</span>)}
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-lora)] text-lg font-bold leading-snug group-hover:text-[var(--accent)]">{novel.title}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">oleh {novel.author}</p>
          </div>
          <p className="text-sm text-[var(--muted)]">{novel.chapters.length} bab · {novel.status}</p>
        </div>
      </Link>
    </article>
  );
}
