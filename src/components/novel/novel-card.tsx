import Image from "next/image";
import Link from "next/link";
import type { Novel } from "@/types/novel";

export function NovelCard({ novel }: { novel: Novel }) {
  return (
    <article className="group ui-card animate-fade-in overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--accent)] hover:shadow-[0_24px_60px_color-mix(in_srgb,var(--accent)_16%,transparent)]">
      <Link href={`/novels/${novel.slug}`} className="block h-full flex flex-col focus-visible:outline-offset-[-5px]">
        <div className="book-perspective relative overflow-hidden bg-[var(--surface-2)] p-3 pb-1 sm:p-4 sm:pb-2">
          {/* 3D Hardcover Book Container */}
          <div className="book-cover-container relative overflow-hidden rounded-lg">
            <span className="book-spine-line" />
            <span className="book-sheen" />
            <Image
              src={novel.cover}
              alt={`Sampul ${novel.title}`}
              width={720}
              height={960}
              className="aspect-[3/4] w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.02]"
            />
            <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-full glass-badge px-2.5 py-1 text-[11px] font-extrabold text-[var(--foreground)]">
              <span aria-hidden="true" className="text-[12px] text-[var(--accent)]">📖</span>
              <span>{novel.chapters.length} bab</span>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between space-y-4 p-4 sm:p-5">
          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              {novel.genres.map((genre) => (
                <span 
                  key={genre} 
                  className="rounded-full bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--accent)] transition-transform duration-200 group-hover:bg-[var(--accent-soft)]"
                >
                  {genre}
                </span>
              ))}
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-lora)] text-lg font-bold leading-snug tracking-tight text-[var(--foreground)] transition-colors duration-200 group-hover:text-[var(--accent)]">
                {novel.title}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[var(--muted)]">
                <span>✍️ oleh</span> <span className="font-bold text-[var(--foreground)]">{novel.author}</span>
              </p>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs font-bold text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--surface-2)] px-2 py-0.5 font-semibold text-[var(--muted)]">
              <span className={`size-1.5 rounded-full ${novel.status.toLowerCase().includes("tamat") || novel.status.toLowerCase().includes("selesai") ? "bg-[var(--success)]" : "bg-amber-500 animate-pulse"}`} />
              {novel.status}
            </span>
            <span className="inline-flex items-center font-extrabold text-[var(--accent)] transition-transform duration-200 group-hover:translate-x-1">
              Mulai baca <span aria-hidden="true" className="ml-1">→</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
