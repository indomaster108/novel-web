import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { getReaderDashboard } from "@/lib/dashboard-data";

export const metadata: Metadata = { title: "Dashboard Pembaca", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export default async function DashboardPage() {
  const dashboard = await getReaderDashboard();
  const continueReading = dashboard.progress[0];
  const displayName = dashboard.displayName ?? "Pembaca";

  return (
    <section className="page-shell py-7 sm:py-12">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[var(--accent)] p-5 text-white shadow-[var(--shadow-raised)] sm:p-8">
        <div className="absolute -right-16 -top-20 size-56 rounded-full border border-white/12" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold tracking-[0.16em] text-white/65 uppercase">Ruang baca pribadi</p>
            <h1 className="mt-2 font-[family-name:var(--font-lora)] text-3xl font-bold leading-tight sm:text-5xl">Halo, {displayName}.</h1>
            <p className="mt-3 break-all text-sm leading-6 text-white/70">{dashboard.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {dashboard.isAdmin && <Link href="/admin" className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-extrabold text-[var(--accent)]">Buka area admin</Link>}
            <form action={logoutAction}><button type="submit" className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-4 text-sm font-extrabold text-white transition hover:bg-white/10">Keluar</button></form>
          </div>
        </div>
      </div>

      {dashboard.error && <p role="status" className="mt-5 rounded-xl bg-red-500/10 p-4 text-sm text-[var(--danger)]">{dashboard.error}</p>}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Bacaan aktif" value={dashboard.progress.length} />
        <StatCard label="Novel tersimpan" value={dashboard.bookmarks.length} />
        <StatCard label="Jenis akun" value={dashboard.isAdmin ? "Admin" : "Pembaca"} wide />
      </div>

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0 space-y-9">
          <section aria-labelledby="continue-heading">
            <SectionHeading eyebrow="Bacaan aktif" title="Lanjut membaca" action={<Link href="/novels" className="text-sm font-extrabold text-[var(--accent)] hover:underline">Cari novel</Link>} id="continue-heading" />
            {continueReading ? (
              <Link href={`/read/${continueReading.slug}/${continueReading.chapterSlug}`} className="group mt-4 block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--shadow)]">
                <div className="grid grid-cols-[88px_minmax(0,1fr)] sm:grid-cols-[128px_minmax(0,1fr)]">
                  <Cover url={continueReading.coverUrl} title={continueReading.title} />
                  <div className="min-w-0 p-4 sm:p-6">
                    <p className="truncate text-xs font-bold text-[var(--highlight)] sm:text-sm">{continueReading.authorName}</p>
                    <h3 className="mt-1 truncate font-[family-name:var(--font-lora)] text-lg font-bold group-hover:text-[var(--accent)] sm:text-2xl">{continueReading.title}</h3>
                    <p className="mt-1 truncate text-xs text-[var(--muted)] sm:text-sm">Bab {continueReading.chapterTitle}</p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${continueReading.progressPercent}%` }} /></div>
                    <p className="mt-2 text-xs text-[var(--muted)]">{continueReading.progressPercent}% selesai</p>
                  </div>
                </div>
              </Link>
            ) : <EmptyState title="Belum ada bacaan aktif" text="Pilih novel dan mulai satu bab. Progresmu akan muncul otomatis di sini." action="Jelajahi koleksi" />}
          </section>

          <section aria-labelledby="history-heading">
            <SectionHeading eyebrow="Jejak halaman" title="Riwayat membaca" id="history-heading" />
            {dashboard.progress.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {dashboard.progress.map((item) => <Link key={item.id} href={`/read/${item.slug}/${item.chapterSlug}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]"><p className="text-xs font-semibold text-[var(--muted)]">{formatDate(item.updatedAt)}</p><h3 className="mt-2 line-clamp-1 font-bold">{item.title}</h3><p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">Bab {item.chapterTitle}</p><p className="mt-3 text-sm font-extrabold text-[var(--accent)]">{item.progressPercent}% selesai</p></Link>)}
              </div>
            ) : <EmptyState title="Riwayat masih kosong" text="Bab yang kamu baca akan tersusun di sini." />}
          </section>

          <section aria-labelledby="bookmarks-heading">
            <SectionHeading eyebrow="Koleksi pribadi" title="Bookmark" id="bookmarks-heading" />
            {dashboard.bookmarks.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {dashboard.bookmarks.map((item) => <Link key={item.id} href={`/novels/${item.slug}`} className="flex min-w-0 gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 transition hover:border-[var(--accent)]"><Cover url={item.coverUrl} title={item.title} compact /><span className="min-w-0 py-1"><span className="block text-xs text-[var(--muted)]">Disimpan {formatDate(item.createdAt)}</span><span className="mt-1 block truncate font-bold">{item.title}</span><span className="mt-1 block truncate text-sm text-[var(--muted)]">{item.authorName}</span></span></Link>)}
              </div>
            ) : <EmptyState title="Belum ada bookmark" text="Simpan novel yang ingin kamu datangi lagi." action="Lihat novel" />}
          </section>
        </div>

        <aside className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
          <div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] font-[family-name:var(--font-lora)] font-bold text-[var(--accent)]">{displayName.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="text-xs font-extrabold tracking-wide text-[var(--accent)] uppercase">Profil pembaca</p><h2 className="truncate font-[family-name:var(--font-lora)] text-xl font-bold">Atur akunmu</h2></div></div>
          <ProfileForm displayName={dashboard.displayName ?? ""} />
          <p className="mt-5 border-t border-[var(--border)] pt-5 text-xs leading-5 text-[var(--muted)]">Data profil, bookmark, dan progres membaca hanya dapat diakses oleh akunmu sendiri.</p>
        </aside>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, id, action }: { eyebrow: string; title: string; id: string; action?: React.ReactNode }) {
  return <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold tracking-[0.14em] text-[var(--accent)] uppercase">{eyebrow}</p><h2 id={id} className="mt-1 font-[family-name:var(--font-lora)] text-2xl font-bold sm:text-3xl">{title}</h2></div>{action}</div>;
}

function StatCard({ label, value, wide = false }: { label: string; value: number | string; wide?: boolean }) {
  return <article className={`ui-card p-4 sm:p-5 ${wide ? "col-span-2 sm:col-span-1" : ""}`}><p className="text-xs font-bold text-[var(--muted)] sm:text-sm">{label}</p><p className="mt-1 font-[family-name:var(--font-lora)] text-2xl font-bold sm:text-3xl">{value}</p></article>;
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: string }) {
  return <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_65%,transparent)] p-6 text-center"><p className="font-[family-name:var(--font-lora)] text-lg font-bold">{title}</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{text}</p>{action && <Link href="/novels" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[var(--accent-soft)] px-4 text-sm font-bold text-[var(--accent)]">{action}</Link>}</div>;
}

function Cover({ url, title, compact = false }: { url: string | null; title: string; compact?: boolean }) {
  const className = compact ? "h-24 w-[72px] shrink-0 rounded-xl object-cover" : "h-full min-h-36 w-full object-cover sm:min-h-44";
  return url ? <Image src={url} alt={`Sampul ${title}`} width={compact ? 72 : 128} height={compact ? 96 : 176} className={className} /> : <div aria-hidden="true" className={`${className} bg-[var(--accent-soft)]`} />;
}
