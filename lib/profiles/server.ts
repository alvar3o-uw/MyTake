import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getOwnProfile() {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) redirect("/sign-in");
  const id = auth.user.id;
  const { data: profile, error } = await supabase.from("profiles").select("id, username").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load your profile. Please try again.");
  return { supabase, id, profile: profile as { id: string; username: string } | null };
}
