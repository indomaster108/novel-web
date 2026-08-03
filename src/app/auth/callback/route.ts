import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const allowedDestinations = new Set(["/dashboard", "/auth/update-password"]);
const otpTypeSchema = z.enum([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  const requestedNext = request.nextUrl.searchParams.get("next") ?? "/dashboard";
  const next = allowedDestinations.has(requestedNext) ? requestedNext : "/dashboard";
  redirectUrl.pathname = next;
  redirectUrl.search = "";

  if (!getSupabaseConfig()) {
    redirectUrl.pathname = "/auth/error";
    redirectUrl.searchParams.set("reason", "configuration");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = otpTypeSchema.safeParse(request.nextUrl.searchParams.get("type"));

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(redirectUrl);
  } else if (tokenHash && type.success) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type.data as EmailOtpType,
    });
    if (!error) return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.pathname = "/auth/error";
  redirectUrl.searchParams.set("reason", "invalid-link");
  return NextResponse.redirect(redirectUrl);
}
