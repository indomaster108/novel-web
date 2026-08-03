"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Viewer = { isAdmin: boolean } | null;

type Tab = {
  href: string;
  label: string;
  icon: "home" | "book" | "library" | "spark" | "comment" | "account";
};

const readerTabs: Tab[] = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/novels", label: "Jelajahi", icon: "book" },
  { href: "/dashboard", label: "Koleksi", icon: "library" },
];

const visitorTabs: Tab[] = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/novels", label: "Jelajahi", icon: "book" },
  { href: "/auth/login", label: "Masuk", icon: "account" },
];

const adminTabs: Tab[] = [
  { href: "/admin", label: "Ringkasan", icon: "spark" },
  { href: "/admin/novels", label: "Novel", icon: "book" },
  { href: "/admin/comments", label: "Komentar", icon: "comment" },
  { href: "/dashboard", label: "Akun", icon: "account" },
];

function isCurrentPath(pathname: string, href: string) {
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTabBar({ viewer }: { viewer: Viewer }) {
  const pathname = usePathname();
  if (pathname.startsWith("/read/") || pathname.startsWith("/auth/")) return null;

  const tabs = viewer?.isAdmin ? adminTabs : viewer ? readerTabs : visitorTabs;
  return (
    <nav aria-label="Navigasi aplikasi" className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:color-mix(in_srgb,var(--border)_88%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_95%,transparent)] px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgb(31_43_36_/_10%)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => {
          const active = isCurrentPath(pathname, tab.href);
          return <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined} className={`group flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-extrabold transition ${active ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--accent)]"}`}><TabIcon name={tab.icon} /><span className="truncate">{tab.label}</span></Link>;
        })}
      </div>
    </nav>
  );
}

function TabIcon({ name }: { name: Tab["icon"] }) {
  const paths: Record<Tab["icon"], React.ReactNode> = {
    home: <><path d="m3.5 10.5 8-6.5 8 6.5" /><path d="M5.5 9.5v9h12v-9M9.5 18.5v-5h4v5" /></>,
    book: <><path d="M5 4.5h9a2 2 0 0 1 2 2v12H7a2 2 0 0 0-2 2v-16Z" /><path d="M5 18.5a2 2 0 0 1 2-2h9" /></>,
    library: <><rect x="4" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="16" rx="1" /><path d="m16 7 2.5 12" /></>,
    spark: <><path d="m12 3 1.3 5.7L19 10l-5.7 1.3L12 17l-1.3-5.7L5 10l5.7-1.3L12 3Z" /><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></>,
    comment: <><path d="M5 5.5h14v10H10l-4.5 3v-3H5v-10Z" /><path d="M8.5 9.5h7M8.5 12.5h4" /></>,
    account: <><circle cx="12" cy="8" r="3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
