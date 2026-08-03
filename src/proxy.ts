import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const LEGACY_PRODUCTION_HOST = "novel-web-fawn.vercel.app";
const CANONICAL_PRODUCTION_HOST = "ra-novel.vercel.app";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.hostname === LEGACY_PRODUCTION_HOST) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.protocol = "https:";
    canonicalUrl.host = CANONICAL_PRODUCTION_HOST;

    return NextResponse.redirect(canonicalUrl, 308);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
