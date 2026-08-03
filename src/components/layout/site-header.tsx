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
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[4.5rem] max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
        <Link
          href="/"
          className="group flex min-h-11 items-center gap-2.5 rounded-xl pr-2 focus-visible:outline-offset-2"
          aria-label="Ruang Aksara, beranda"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent)] font-[family-name:var(--font-lora)] text-sm font-bold text-white shadow-[0_8px_24px_color-mix(in_srgb,var(--accent)_22%,transparent)] transition group-hover:-rotate-2">
            RA
          </span>
          <span className="hidden font-[family-name:var(--font-lora)] text-lg font-bold tracking-tight sm:block">
            Ruang <span className="text-[var(--accent)]">Aksara</span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="flex items-center gap-0.5 text-sm font-bold sm:gap-1.5">
          <Link href="/novels" className="inline-flex min-h-11 items-center rounded-xl px-2.5 transition hover:bg-[var(--surface-2)] hover:text-[var(--accent)] sm:px-3.5">
            Novel
          </Link>
          <Link
            href={accountHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2.5 transition hover:bg-[var(--surface-2)] hover:text-[var(--accent)] sm:px-3.5"
            aria-label={viewer?.email ? `${accountLabel}, ${viewer.email}` : accountLabel}
          >
            {viewer && <span aria-hidden="true" className="size-2 rounded-full bg-[var(--success)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--success)_14%,transparent)]" />}
            {accountLabel}
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
