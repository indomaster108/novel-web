import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAdminNovels } from "@/lib/admin-data";
import { StudioClient } from "@/components/admin/studio-client";

export const metadata: Metadata = {
  title: "Infinite Scribe Studio",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminStudioPage() {
  await requireAdmin();
  const res = await getAdminNovels();

  return <StudioClient initialNovels={res.novels} />;
}
