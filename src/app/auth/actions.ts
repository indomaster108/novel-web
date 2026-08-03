"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseConfig } from "@/lib/env";
import { requireViewer } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  status: "idle" | "error" | "success";
  message: string;
};

const credentialsSchema = z.object({
  email: z.email("Masukkan alamat email yang valid.").max(254),
  password: z.string().min(8, "Kata sandi minimal terdiri dari 8 karakter.").max(128),
});

const registrationSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(1, "Nama tampilan wajib diisi.").max(80),
});

const emailSchema = z.object({ email: z.email("Masukkan alamat email yang valid.").max(254) });
const passwordSchema = z.object({ password: z.string().min(8).max(128) });

const missingConfig: AuthState = {
  status: "error",
  message: "Supabase belum dikonfigurasi. Isi .env.local berdasarkan .env.example.",
};

function invalid(message: string): AuthState {
  return { status: "error", message };
}

export async function loginAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!getSupabaseConfig()) return missingConfig;
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? "Data login tidak valid.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return invalid("Email atau kata sandi tidak sesuai.");

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function registerAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!getSupabaseConfig()) return missingConfig;
  const parsed = registrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? "Data registrasi tidak valid.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) return invalid("Akun belum dapat dibuat. Periksa data atau coba kembali nanti.");
  return { status: "success", message: "Periksa email untuk menyelesaikan verifikasi akun." };
}

export async function forgotPasswordAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!getSupabaseConfig()) return missingConfig;
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? "Email tidak valid.");

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/auth/update-password`,
  });

  return {
    status: "success",
    message: "Jika akun tersebut tersedia, tautan pemulihan akan dikirim melalui email.",
  };
}

export async function updatePasswordAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!getSupabaseConfig()) return missingConfig;
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid("Kata sandi harus terdiri dari 8–128 karakter.");
  await requireViewer();

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return invalid("Kata sandi belum dapat diperbarui. Minta tautan pemulihan baru.");

  return { status: "success", message: "Kata sandi berhasil diperbarui." };
}

export async function logoutAction() {
  if (getSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}
