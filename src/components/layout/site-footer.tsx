import Link from "next/link";

type Viewer = { isAdmin: boolean } | null;

export function SiteFooter({ viewer }: { viewer: Viewer }) {
  const accountHref = viewer?.isAdmin ? "/admin" : viewer ? "/dashboard" : "/auth/login";
  const accountLabel = viewer?.isAdmin ? "Area admin" : viewer ? "Dashboard" : "Masuk pembaca";

  return (
    <footer className="border-t border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)]">
      <div className="page-shell grid gap-7 pb-24 pt-10 sm:grid-cols-[1fr_auto] sm:items-end sm:py-10">
        <div>
          <p className="font-[family-name:var(--font-lora)] text-lg font-bold">Ruang Aksara</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Ruang yang tenang untuk membaca cerita orisinal dan kembali ke halaman terakhirmu tanpa kehilangan jejak.</p>
          <p className="mt-5 text-xs text-[var(--muted)]">© {new Date().getFullYear()} Ruang Aksara.</p>
        </div>
        <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold">
          <Link href="/novels" className="hover:text-[var(--accent)]">Jelajahi novel</Link>
          <Link href={accountHref} className="hover:text-[var(--accent)]">{accountLabel}</Link>
        </nav>
      </div>
    </footer>
  );
}
