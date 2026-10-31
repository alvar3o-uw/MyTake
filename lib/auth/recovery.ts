import type { SupabaseClient } from "@supabase/supabase-js";


type RecoveryAuth = Pick<SupabaseClient["auth"], "getUser" | "updateUser" | "signOut">;
type ResetAuth = Pick<SupabaseClient["auth"], "resetPasswordForEmail">;
export type ResetRequestResult = { message: string; error?: never } | { error: string; message?: never };

const RESET_UNREACHABLE = "Couldn’t reach the sign-in service. Please try again.";

export async function sendPasswordResetEmail(auth: ResetAuth, email: string, redirectTo: string): Promise<ResetRequestResult> {
  try {
    const { error } = await auth.resetPasswordForEmail(email, { redirectTo });
    // Status 0 means the request never reached Supabase.
    if (error?.name === "AuthRetryableFetchError" && error.status === 0) return { error: RESET_UNREACHABLE };
  } catch { return { error: RESET_UNREACHABLE }; }
  // Every Supabase reply, rate limits included, gets the same message, so the
  // form never reveals whether an account exists for the address.
  return { message: "If an account exists for that address, you’ll receive a password reset link." };
}
export type PasswordChangeResult = { updated: true; signedOut: boolean; error?: never } | { error: string; updated?: never; signedOut?: never };

export async function changeRecoveredPassword(auth: RecoveryAuth, password: unknown, confirmation: unknown): Promise<PasswordChangeResult> {
  const invalid = typeof password !== "string" || password.length < 8 ? "Use at least 8 characters for your password." : password !== confirmation ? "Your passwords don’t match." : null;
  if (invalid) return { error: invalid };
  try {
    const { data: { user }, error: authError } = await auth.getUser();
    if (authError || !user) return { error: "Your reset session has expired. Request a new reset link." };
    const { error } = await auth.updateUser({ password: password as string });
    if (error) return { error: error.code === "same_password" ? "Choose a password different from your current password." : error.code === "weak_password" ? "Choose a stronger password with at least 8 characters." : "Couldn’t confirm the password change. Try signing in with the new password before requesting another link." };
    try {
      const { error: signOutError } = await auth.signOut({ scope: "global" });
      return { updated: true, signedOut: !signOutError };
    } catch { return { updated: true, signedOut: false }; }
  } catch { return { error: "Couldn’t confirm the password change. Try signing in with the new password before requesting another link." }; }
}
