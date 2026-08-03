"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = { status: "idle" | "error" | "success"; message: string };

const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Nama tampilan wajib diisi.").max(80, "Nama tampilan maksimal 80 karakter."),
});

export async function updateProfileAction(_state: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  if (!getSupabaseConfig()) return { status: "error", message: "Supabase belum dikonfigurasi." };
  const parsed = profileSchema.safeParse({ displayName: formData.get("displayName") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Nama tampilan tidak valid." };
  const viewer = await requireViewer();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", viewer.id);
  if (error) return { status: "error", message: "Profil belum dapat diperbarui." };
  revalidatePath("/dashboard");
  return { status: "success", message: "Nama tampilan diperbarui." };
}
