import Image from "next/image";
import Link from "next/link";
import type { Novel } from "@/types/novel";

export function NovelCard({ novel }: { novel: Novel }) {
  return (
    <article className="group ui-card overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[var(--shadow)]">
      <Link href={`/novels/${novel.slug}`} className="block focus-visible:outline-offset-[-5px]">
        <div className="relative overflow-hidden bg-[var(--surface-2)]">
          <Image
            src={novel.cover}
            alt={`Sampul ${novel.title}`}
            width={720}
            height={960}
            className="aspect-[3/4] w-full object-cover transition duration-500 motion-safe:group-hover:scale-[1.035]"
          />
          <span className="absolute bottom-3 left-3 rounded-full bg-[color:color-mix(in_srgb,var(--surface)_91%,transparent)] px-2.5 py-1 text-[11px] font-extrabold text-[var(--foreground)] backdrop-blur">
            {novel.chapters.length} bab
          </span>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {novel.genres.map((genre) => <span key={genre} className="rounded-full bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">{genre}</span>)}
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-lora)] text-lg font-bold leading-snug transition group-hover:text-[var(--accent)]">{novel.title}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">oleh {novel.author}</p>
          </div>
          <p className="border-t border-[var(--border)] pt-3 text-xs font-semibold text-[var(--muted)]">{novel.status}</p>
        </div>
      </Link>
    </article>
  );
}
