import type { Metadata } from "next";
import { VerifyOtpForm } from "@/components/auth/verify-otp-form";
import { getSupabaseConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Verifikasi Email",
  description: "Verifikasi akun pembaca Ruang Aksara menggunakan kode sekali pakai.",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return <VerifyOtpForm configured={Boolean(getSupabaseConfig())} />;
}
