import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const otpTypeSchema = z.enum([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: NextRequest) {
  const destination = request.nextUrl.clone();
  destination.search = "";

  if (!getSupabaseConfig()) {
    destination.pathname = "/auth/error";
    destination.searchParams.set("reason", "configuration");
    return NextResponse.redirect(destination);
  }

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = otpTypeSchema.safeParse(request.nextUrl.searchParams.get("type"));

  if (tokenHash && type.success) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type.data as EmailOtpType,
    });

    if (!error) {
      destination.pathname = type.data === "recovery"
        ? "/auth/update-password"
        : data.user?.app_metadata?.role === "admin"
          ? "/admin"
          : "/dashboard";
      return NextResponse.redirect(destination);
    }
  }

  destination.pathname = "/auth/error";
  destination.searchParams.set("reason", "invalid-link");
  return NextResponse.redirect(destination);
}
