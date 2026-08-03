import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { getSupabaseConfig } from "@/lib/env";
export const metadata: Metadata = { title: "Masuk", robots: { index: false, follow: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  return <AuthForm mode="login" configured={Boolean(getSupabaseConfig())} notice={notice} />;
}
