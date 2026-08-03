import { z } from "zod";

const supabaseUrlSchema = z
  .url("NEXT_PUBLIC_SUPABASE_URL harus berupa URL HTTPS Supabase yang valid.")
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co") && !url.username && !url.password;
  }, "NEXT_PUBLIC_SUPABASE_URL harus memakai HTTPS dan domain *.supabase.co tanpa kredensial tertanam.");

const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrlSchema,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .regex(/^sb_publishable_[A-Za-z0-9_-]+$/, "Gunakan Supabase publishable key (sb_publishable_...), bukan secret atau service-role key."),
});

const siteUrlSchema = z
  .url("NEXT_PUBLIC_SITE_URL harus berupa URL absolut yang valid.")
  .refine((value) => {
    const url = new URL(value);
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    return !url.username && !url.password && (url.protocol === "https:" || (isLocal && url.protocol === "http:"));
  }, "NEXT_PUBLIC_SITE_URL harus memakai HTTPS; HTTP hanya diizinkan untuk localhost.");

export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const parsed = supabaseEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!parsed.success) return null;

  return {
    url: new URL(parsed.data.NEXT_PUBLIC_SUPABASE_URL).origin,
    publishableKey: parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function requireSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      "Supabase belum dikonfigurasi. Salin .env.example ke .env.local lalu isi URL dan publishable key project.",
    );
  }
  return config;
}

export function requireSiteUrl() {
  const parsed = siteUrlSchema.safeParse(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  );
  if (!parsed.success) {
    throw new Error("NEXT_PUBLIC_SITE_URL tidak valid. Gunakan HTTPS, atau http://localhost:3000 saat development.");
  }
  return new URL(parsed.data).origin;
}
