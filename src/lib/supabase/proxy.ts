import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

const privatePaths = ["/dashboard", "/admin"];

export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();
  if (!config) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headersToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headersToSet).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const pathname = request.nextUrl.pathname;
  const isAuthenticated = !error && Boolean(data?.claims?.sub);
  const needsAuthentication = privatePaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (needsAuthentication && (error || !data?.claims?.sub)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("notice", "login-required");
    return NextResponse.redirect(loginUrl);
  }

  if (
    isAuthenticated &&
    (pathname === "/auth/login" || pathname === "/auth/register" || pathname === "/auth/verify")
  ) {
    const accountUrl = request.nextUrl.clone();
    accountUrl.pathname = data?.claims?.app_metadata?.role === "admin" ? "/admin" : "/dashboard";
    accountUrl.search = "";
    return NextResponse.redirect(accountUrl);
  }

  if (
    (pathname === "/admin" || pathname.startsWith("/admin/")) &&
    data?.claims?.app_metadata?.role !== "admin"
  ) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}
