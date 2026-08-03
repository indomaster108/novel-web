import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { getSupabaseConfig } from "@/lib/env";
export const metadata: Metadata = { title: "Lupa Kata Sandi", robots: { index: false, follow: false } };
export default function ForgotPasswordPage() { return <AuthForm mode="forgot" configured={Boolean(getSupabaseConfig())} />; }
