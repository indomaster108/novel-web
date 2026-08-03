import Link from "next/link";

type Viewer = { isAdmin: boolean } | null;

export function SiteFooter({ viewer }: { viewer: Viewer }) {
  const accountHref = viewer?.isAdmin ? "/admin" : viewer ? "/dashboard" : "/auth/login";
  const accountLabel = viewer?.isAdmin ? "Area admin" : viewer ? "Dashboard" : "Masuk pembaca";

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-6xl gap-7 px-4 py-10 sm:grid-cols-[1fr_auto] sm:items-end sm:px-6">
        <div>
          <p className="font-[family-name:var(--font-lora)] text-lg font-bold">Ruang Aksara</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Ruang yang tenang untuk membaca cerita orisinal dan kembali ke halaman terakhirmu.</p>
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
