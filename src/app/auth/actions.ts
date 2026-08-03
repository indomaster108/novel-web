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
const emailOtpSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Masukkan alamat email yang valid.").max(254)),
  token: z.string().trim().regex(/^\d{6}$/, "Kode verifikasi harus terdiri dari 6 angka."),
});
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
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return invalid("Email atau kata sandi tidak sesuai.");

  revalidatePath("/", "layout");
  redirect(data.user.app_metadata?.role === "admin" ? "/admin" : "/dashboard");
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
      emailRedirectTo: getSiteUrl(),
    },
  });

  if (error) return invalid("Akun belum dapat dibuat. Periksa data atau coba kembali nanti.");
  return {
    status: "success",
    message: "Akun pembaca dibuat. Masukkan kode 6 digit yang kami kirim ke emailmu.",
  };
}

export async function verifyEmailOtpAction(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!getSupabaseConfig()) return missingConfig;
  const parsed = emailOtpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message ?? "Email atau kode verifikasi tidak valid.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email",
  });

  if (error || !data.user) {
    return invalid("Kode tidak valid atau sudah kedaluwarsa. Periksa kode terbaru lalu coba lagi.");
  }

  revalidatePath("/", "layout");
  redirect(data.user.app_metadata?.role === "admin" ? "/admin" : "/dashboard");
}

export async function resendConfirmationAction(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!getSupabaseConfig()) return missingConfig;
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? "Email tidak valid.");

  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: getSiteUrl() },
  });

  return {
    status: "success",
    message: "Jika akun masih menunggu verifikasi, kode baru akan dikirim. Gunakan kode dari email terbaru.",
  };
}

export async function forgotPasswordAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!getSupabaseConfig()) return missingConfig;
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? "Email tidak valid.");

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: getSiteUrl(),
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
