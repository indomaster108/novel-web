import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { getReaderDashboard } from "@/lib/dashboard-data";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export default async function DashboardPage() {
  const dashboard = await getReaderDashboard();
  const continueReading = dashboard.progress[0];

  return <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div><p className="text-sm font-bold text-[var(--accent)]">Area pembaca</p><h1 className="mt-2 font-[family-name:var(--font-lora)] text-4xl font-bold">Halo, {dashboard.displayName ?? "Pembaca"}.</h1><p className="mt-3 text-sm text-[var(--muted)]">{dashboard.email}</p></div>
      <form action={logoutAction}><button type="submit" className="min-h-11 rounded-full border border-[var(--border)] px-4 text-sm font-bold hover:border-[var(--accent)]">Keluar</button></form>
    </div>

    {dashboard.error && <p role="status" className="mt-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-800">{dashboard.error}</p>}

    <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-8">
        <section aria-labelledby="continue-heading"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold text-[var(--accent)]">Bacaan aktif</p><h2 id="continue-heading" className="mt-1 font-[family-name:var(--font-lora)] text-2xl font-bold">Lanjut membaca</h2></div><Link href="/novels" className="text-sm font-bold text-[var(--accent)] hover:underline">Jelajahi novel</Link></div>
          {continueReading ? <Link href={`/read/${continueReading.slug}/${continueReading.chapterSlug}`} className="mt-4 block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition hover:border-[var(--accent)]"><div className="grid sm:grid-cols-[128px_1fr]"><Cover url={continueReading.coverUrl} title={continueReading.title} /><div className="p-5"><p className="text-sm text-[var(--muted)]">{continueReading.authorName}</p><h3 className="mt-1 font-[family-name:var(--font-lora)] text-xl font-bold">{continueReading.title}</h3><p className="mt-2 text-sm">Bab {continueReading.chapterTitle}</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--border)]"><div className="h-full bg-[var(--accent)]" style={{ width: `${continueReading.progressPercent}%` }} /></div><p className="mt-2 text-xs text-[var(--muted)]">{continueReading.progressPercent}% · terakhir dibaca {formatDate(continueReading.updatedAt)}</p></div></div></Link> : <EmptyState text="Belum ada progres membaca. Pilih novel untuk mulai membaca." />}
        </section>

        <section aria-labelledby="history-heading"><h2 id="history-heading" className="font-[family-name:var(--font-lora)] text-2xl font-bold">Riwayat membaca</h2>{dashboard.progress.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{dashboard.progress.map((item) => <Link key={item.id} href={`/read/${item.slug}/${item.chapterSlug}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]"><p className="text-xs text-[var(--muted)]">{formatDate(item.updatedAt)}</p><h3 className="mt-2 font-bold">{item.title}</h3><p className="mt-1 text-sm text-[var(--muted)]">Bab {item.chapterTitle}</p><p className="mt-3 text-sm font-bold text-[var(--accent)]">{item.progressPercent}% selesai</p></Link>)}</div> : <EmptyState text="Riwayat membaca akan tampil di sini." />}</section>

        <section aria-labelledby="bookmarks-heading"><h2 id="bookmarks-heading" className="font-[family-name:var(--font-lora)] text-2xl font-bold">Bookmark</h2>{dashboard.bookmarks.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{dashboard.bookmarks.map((item) => <Link key={item.id} href={`/novels/${item.slug}`} className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition hover:border-[var(--accent)]"><Cover url={item.coverUrl} title={item.title} compact /><span className="min-w-0 py-1"><span className="block text-xs text-[var(--muted)]">Disimpan {formatDate(item.createdAt)}</span><span className="mt-1 block font-bold">{item.title}</span><span className="mt-1 block text-sm text-[var(--muted)]">{item.authorName}</span></span></Link>)}</div> : <EmptyState text="Simpan novel dari halaman detail untuk membuat bookmark." />}</section>
      </div>

      <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><p className="text-sm font-bold text-[var(--accent)]">Profil</p><h2 className="mt-1 font-[family-name:var(--font-lora)] text-2xl font-bold">Atur akunmu</h2><ProfileForm displayName={dashboard.displayName ?? ""} />{dashboard.isAdmin && <Link href="/admin" className="mt-8 inline-flex min-h-11 items-center rounded-full border border-[var(--accent)] px-4 text-sm font-bold text-[var(--accent)]">Buka dashboard admin</Link>}</aside>
    </div>
  </section>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted)]">{text}</p>;
}

function Cover({ url, title, compact = false }: { url: string | null; title: string; compact?: boolean }) {
  return url ? <Image src={url} alt={`Sampul ${title}`} width={compact ? 72 : 128} height={compact ? 96 : 172} className={compact ? "h-24 w-[72px] rounded-lg object-cover" : "h-44 w-full object-cover sm:h-full"} /> : <div aria-hidden="true" className={compact ? "h-24 w-[72px] rounded-lg bg-[color:color-mix(in_srgb,var(--accent)_15%,var(--background))]" : "h-44 bg-[color:color-mix(in_srgb,var(--accent)_15%,var(--background))] sm:h-full"} />;
}
