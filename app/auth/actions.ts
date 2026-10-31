"use server";

import { redirect } from "next/navigation";
import { isValidEmail } from "@/lib/auth/email";
import { getAuthSiteUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

export async function authenticate(mode: "sign-in" | "sign-up", _previous: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };
  if (!password) return { error: "Enter your password." };
  if (mode === "sign-up") {
    if (password !== String(form.get("confirmPassword") ?? "")) return { error: "Your passwords don’t match." };
    if (password.length < 8) return { error: "Use at least 8 characters for your password." };
  }

  const supabase = await createClient();
  try {
    if (mode === "sign-up") {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${await getAuthSiteUrl()}/auth/callback` },
      });
      if (error) return { error: error.code === "over_email_send_rate_limit" ? "Too many requests. Please try again later." : "We couldn’t create your account. Please try again or sign in if you already have one." };
      if (!data.session) return { message: "Check your email to confirm your account, then sign in." };
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: "Unable to sign in. Check your email and password, and confirm your email if needed." };
    }
  } catch {
    return { error: "Unable to reach the sign-in service. Please try again." };
  }
  redirect("/library");
}

export async function signOut(): Promise<AuthState> {
  const supabase = await createClient();
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: "Couldn’t sign out. Please try again." };
  } catch {
    return { error: "Couldn’t reach the sign-in service. Please try again." };
  }
  redirect("/sign-in");
}
