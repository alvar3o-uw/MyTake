import { NextResponse, type NextRequest } from "next/server";
import { authCallbackDestination, resolveAuthOrigin } from "@/lib/auth/urls";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  let origin: string;
  try {
    // Next dev can normalize request.url to localhost. Preserve only known local hosts.
    const development = process.env.NODE_ENV === "development";
    const localOrigin = development ? `${request.nextUrl.protocol}//${request.headers.get("host")}` : null;
    origin = resolveAuthOrigin(process.env.NEXT_PUBLIC_SITE_URL, localOrigin, development, Boolean(process.env.VERCEL));
  } catch {
    return NextResponse.json({ error: "Authentication URL configuration is unavailable." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
  const destination = authCallbackDestination(request.nextUrl.searchParams.get("next"));
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.session) {
        return NextResponse.redirect(new URL(destination, origin), { headers: { "Cache-Control": "private, no-store" } });
      }
    } catch { /* Expired/missing verifier and network failures receive the same safe retry page. */ }
  }
  return NextResponse.redirect(new URL(destination === "/reset-password" ? "/forgot-password?link=invalid" : "/sign-in?confirmation=failed", origin), { headers: { "Cache-Control": "private, no-store" } });
}
