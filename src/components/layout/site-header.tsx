import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type Viewer = {
  email: string | null;
  isAdmin: boolean;
} | null;

export function SiteHeader({ viewer }: { viewer: Viewer }) {
  const accountHref = viewer?.isAdmin ? "/admin" : viewer ? "/dashboard" : "/auth/login";
  const accountLabel = viewer?.isAdmin ? "Admin" : viewer ? "Dashboard" : "Masuk";

  return (
    <header className="sticky top-0 z-30 border-b border-[color:color-mix(in_srgb,var(--border)_82%,transparent)] bg-[color:color-mix(in_srgb,var(--background)_92%,transparent)] backdrop-blur-xl">
      <div className="page-shell flex min-h-[4.5rem] items-center justify-between gap-2">
        <Link
          href="/"
          className="group flex min-h-11 items-center gap-2.5 rounded-xl pr-2 focus-visible:outline-offset-2"
          aria-label="Ruang Aksara, beranda"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent)] font-[family-name:var(--font-lora)] text-sm font-bold text-white shadow-[0_8px_24px_color-mix(in_srgb,var(--accent)_22%,transparent)] transition duration-200 group-hover:-rotate-2 group-hover:scale-[1.03]">
            RA
          </span>
          <span className="font-[family-name:var(--font-lora)] text-base font-bold tracking-tight sm:text-lg">
            Ruang <span className="text-[var(--accent)]">Aksara</span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="flex items-center gap-0.5 text-sm font-bold sm:gap-1.5">
          <Link href="/novels" className="inline-flex min-h-11 items-center rounded-xl px-2.5 transition hover:bg-[var(--surface-2)] hover:text-[var(--accent)] sm:px-3.5">
            <span className="sm:hidden">Baca</span><span className="hidden sm:inline">Jelajahi</span>
          </Link>
          {viewer?.isAdmin && (
            <Link
              href="/admin/studio"
              className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-[color:color-mix(in_srgb,var(--accent)_15%,transparent)] px-2.5 font-extrabold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white sm:px-3.5"
            >
              <span aria-hidden="true">✦</span>
              <span>Studio</span>
            </Link>
          )}
          <Link
            href={accountHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2.5 transition hover:bg-[var(--surface-2)] hover:text-[var(--accent)] sm:px-3.5"
            aria-label={viewer?.email ? `${accountLabel}, ${viewer.email}` : accountLabel}
          >
            {viewer && <span aria-hidden="true" className="size-2 rounded-full bg-[var(--success)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--success)_14%,transparent)]" />}
            <span className="hidden min-[390px]:inline">{accountLabel}</span>
            <span className="min-[390px]:hidden" aria-hidden="true">•</span>
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
