import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-options";
import { createResetCookieBuffer } from "@/lib/supabase/reset-cookie-buffer";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components cannot write cookies; proxy refreshes the session.
          }
        },
      },
    },
  );
}

// For reset-email requests only: cookies are held until the request is over
// and then written once, so the response can't reveal Supabase's answer
// (see reset-cookie-buffer.ts).
export async function createPasswordResetClient() {
  const cookieStore = await cookies();
  const buffer = createResetCookieBuffer(() => cookieStore.getAll());
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookieOptions: supabaseCookieOptions, cookies: buffer },
  );
  return {
    supabase,
    saveCookies() { buffer.writes().forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
  };
}
