"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountState = { error?: string };

export async function deleteAccount(_previous: DeleteAccountState, form: FormData): Promise<DeleteAccountState> {
  if (form.get("confirmation") !== "DELETE") return { error: "Confirm account deletion to continue." };
  const supabase = await createClient();
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Your session expired. Sign in again before deleting your account." };
    const { data, error } = await supabase.functions.invoke("delete-account", { body: { confirmation: "DELETE" } });
    if (error || !data?.deleted) return { error: "Couldn’t delete your account. Please try again. If you already confirmed deletion, try signing in to check your account’s status." };
  } catch {
    return { error: "Couldn’t confirm deletion. Check your connection, then try signing in to check your account’s status." };
  }
  // Clear this browser's session even though the account no longer exists remotely.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
