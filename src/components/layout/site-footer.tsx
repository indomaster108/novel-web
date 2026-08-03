import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Ruang Aksara. Ruang untuk cerita orisinal.</p>
        <div className="flex gap-4 font-semibold">
          <Link href="/novels" className="hover:text-[var(--accent)]">Jelajahi novel</Link>
          <Link href="/auth/login" className="hover:text-[var(--accent)]">Akun</Link>
        </div>
      </div>
    </footer>
  );
}
