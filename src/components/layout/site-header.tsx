import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--background)_94%,transparent)] backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="font-[family-name:var(--font-lora)] text-lg font-bold tracking-tight" aria-label="Ruang Aksara, beranda">
          Ruang <span className="text-[var(--accent)]">Aksara</span>
        </Link>
        <nav aria-label="Navigasi utama" className="flex items-center gap-1 text-sm font-semibold">
          <Link href="/novels" className="rounded-full px-3 py-2 transition hover:text-[var(--accent)]">Novel</Link>
          <Link href="/auth/login" className="hidden rounded-full px-3 py-2 transition hover:text-[var(--accent)] sm:block">Masuk</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
