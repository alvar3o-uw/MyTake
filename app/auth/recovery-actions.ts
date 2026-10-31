"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthSiteUrl } from "@/lib/auth/site-url";
import { isValidEmail } from "@/lib/auth/email";
import { changeRecoveredPassword, sendPasswordResetEmail } from "@/lib/auth/recovery";
import type { AuthState } from "./actions";

export async function requestPasswordReset(_previous: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };
  let origin: string;
  try { origin = await getAuthSiteUrl(); }
  catch { return { error: "Password recovery isn’t configured for this address. Please use the main MyTake website." }; }
  try {
    const supabase = await createClient();
    return await sendPasswordResetEmail(supabase.auth, email, `${origin}/auth/callback?next=/reset-password`);
  } catch { return { error: "Couldn’t reach the sign-in service. Please try again." }; }
}

export async function updateRecoveredPassword(_previous: AuthState, form: FormData): Promise<AuthState> {
  try {
    const supabase = await createClient();
    const result = await changeRecoveredPassword(supabase.auth, form.get("password"), form.get("confirmPassword"));
    if (result.error) return { error: result.error };
    if (!result.signedOut) return { message: "Your password was updated, but sign-out could not be confirmed. Please sign in with your new password." };
  } catch { return { error: "Couldn’t reach the sign-in service. Please try again." }; }
  redirect("/sign-in?password=updated");
}
