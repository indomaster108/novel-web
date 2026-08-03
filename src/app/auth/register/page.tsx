import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { getSupabaseConfig } from "@/lib/env";
export const metadata: Metadata = { title: "Buat Akun", robots: { index: false, follow: false } };
export default function RegisterPage() { return <AuthForm mode="register" configured={Boolean(getSupabaseConfig())} />; }
