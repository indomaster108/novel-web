import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getViewer() {
  if (!getSupabaseConfig()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
    isAdmin: data.claims.app_metadata?.role === "admin",
  };
}

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/auth/login?notice=login-required");
  return viewer;
}

export async function requireAdmin() {
  const viewer = await requireViewer();
  if (!viewer.isAdmin) redirect("/dashboard");
  return viewer;
}
