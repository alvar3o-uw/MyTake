"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/profiles/server";
import { validateUsername } from "@/lib/profiles/username";

export type ProfileState = { error?: string; message?: string; username?: string };

export async function saveProfile(mode: "setup" | "settings", _previous: ProfileState, form: FormData): Promise<ProfileState> {
  const username = String(form.get("username") ?? "").trim();
  const invalid = validateUsername(username);
  if (invalid) return { error: invalid, username };

  const { supabase, id, profile } = await getOwnProfile();
  let error;
  try {
    const result = profile
      ? await supabase.from("profiles").update({ username }).eq("id", id).select("username").single()
      : await supabase.from("profiles").insert({ id, username }).select("username").single();
    error = result.error;
  } catch {
    return { error: "Couldn’t save your username. Check your connection and try again.", username };
  }
  if (error) {
    return { error: error.code === "23505" ? "That username is already taken. Try another." : "Couldn’t save your username. Please try again.", username };
  }
  revalidatePath("/library", "layout");
  revalidatePath("/settings");
  redirect(mode === "setup" ? "/library" : "/library?profile=updated");
}
