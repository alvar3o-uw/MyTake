import type { SupabaseClient } from "@supabase/supabase-js";


type RecoveryAuth = Pick<SupabaseClient["auth"], "getUser" | "updateUser" | "signOut">;
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
