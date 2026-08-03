import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { requireViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Perbarui Kata Sandi", robots: { index: false, follow: false } };

export default async function UpdatePasswordPage() {
  await requireViewer();
  return <UpdatePasswordForm />;
}
