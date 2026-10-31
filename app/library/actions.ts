"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { storageLimitMessage } from "@/lib/storage-limits";
import { normalizeResults } from "@/lib/tmdb/media";
import { normalizeEpisodes } from "@/lib/tmdb/episodes";
import { validateLibraryInput, type SaveLibraryInput } from "@/lib/library/input";
import { librarySelection, toLibraryEntry, type LibraryRecord } from "@/lib/library/records";
import type { LibraryEntry } from "../types";

export type SaveLibraryResult = { entry: LibraryEntry; error?: never } | { error: string; entry?: never };

export async function saveLibraryEntry(input: SaveLibraryInput): Promise<SaveLibraryResult> {
  const invalid = validateLibraryInput(input);
  if (invalid) return { error: invalid };
  const supabase = await createClient();
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Your session expired. Sign in again before saving." };
    // A previous request may have saved successfully even if its response was lost.
    const existing = await supabase.from("library_entries").select(librarySelection).eq("user_id", user.id).eq("id", input.requestId).maybeSingle();
    if (existing.error) return { error: "Couldn’t check your library. Your selections are still here; please try again." };
    if (existing.data) return { entry: toLibraryEntry(existing.data as unknown as LibraryRecord) };

    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    if (!token) return { error: "The media catalogue is unavailable. Please try again later." };
    async function catalogue(path: string) {
      const response = await fetch(`https://api.themoviedb.org/3/${path}?language=en-US`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(8000), cache: "no-store",
      });
      if (!response.ok) throw new Error("Catalogue unavailable");
      return response.json();
    }
    // Re-fetch catalogue metadata; never trust a submitted title, poster or episode name.
    const raw = await catalogue(`${input.mediaType}/${input.tmdbId}`);
    const media = normalizeResults([{ ...raw, media_type: input.mediaType }])[0];
    if (!media || media.tmdbId !== input.tmdbId) return { error: "That title is no longer available. Choose another search result." };
    let progress;
    if (input.progress) {
      const season = await catalogue(`tv/${input.tmdbId}/season/${input.progress.seasonNumber}`);
      progress = normalizeEpisodes(season.episodes, input.progress.seasonNumber).find((episode) => episode.episodeId === input.progress!.episodeId && episode.episodeNumber === input.progress!.episodeNumber);
      if (!progress) return { error: "That episode doesn’t match this show. Please select the episode again." };
    }
    const { error: saveError } = await supabase.rpc("save_library_entry", {
      p_entry_id: input.requestId, p_tmdb_id: media.tmdbId, p_media_type: media.mediaType,
      p_title: media.title, p_release_year: media.year, p_poster_path: media.posterPath,
      p_rating: input.rating, p_viewing_status: input.status === "Completed" ? "completed" : "in_progress",
      p_episode_id: progress?.episodeId ?? null, p_season_number: progress?.seasonNumber ?? null,
      p_episode_number: progress?.episodeNumber ?? null, p_episode_name: progress?.episodeName ?? null,
    });
    if (saveError) {
      const limitMessage = storageLimitMessage(saveError);
      if (limitMessage) return { error: limitMessage };
      if (saveError.code === "23505") {
        const retry = await supabase.from("library_entries").select(librarySelection).eq("user_id", user.id).eq("id", input.requestId).maybeSingle();
        if (retry.data) return { entry: toLibraryEntry(retry.data as unknown as LibraryRecord) };
        const membership = await supabase.from("media_snapshots").select("collection").eq("user_id", user.id).eq("tmdb_id", input.tmdbId).eq("media_type", input.mediaType).maybeSingle();
        return { error: membership.data?.collection === "watchlist" ? "This title is on your watchlist. Move it to your library from there." : "This title is already in your library. Your existing rating hasn’t changed." };
      }
      return { error: "Couldn’t confirm the save. Your selections are still here; try again or refresh your library to check." };
    }
    const saved = await supabase.from("library_entries").select(librarySelection).eq("user_id", user.id).eq("id", input.requestId).single();
    if (saved.error || !saved.data) return { error: "The save may have completed, but confirmation failed. Try again or refresh your library to check." };
    revalidatePath("/library");
    revalidatePath("/profile");
    revalidatePath("/media/[type]/[id]", "page");
    return { entry: toLibraryEntry(saved.data as unknown as LibraryRecord) };
  } catch {
    return { error: "Couldn’t confirm the save. Check your connection and try again, or refresh your library to check." };
  }
}

export async function removeLibraryEntry(entryId: string, confirmed: boolean): Promise<{ removedId?: string; error?: string }> {
  if (confirmed !== true || typeof entryId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryId)) return { error: "Confirm which entry you want to remove." };
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Your session expired. Sign in again before removing this entry." };
    const { data: entry, error: readError } = await supabase.from("library_entries").select("media_id").eq("id", entryId).eq("user_id", user.id).maybeSingle();
    if (readError) return { error: "Couldn’t check this entry. Please try again." };
    if (entry) {
      // Deleting the owner-private snapshot atomically cascades to its rating/progress.
      const { error } = await supabase.from("media_snapshots").delete().eq("id", entry.media_id).eq("user_id", user.id);
      if (error) return { error: "Couldn’t remove this entry. Please try again." };
      const verification = await supabase.from("library_entries").select("id").eq("id", entryId).eq("user_id", user.id).maybeSingle();
      if (verification.error || verification.data) return { error: "Couldn’t confirm removal. Try again or refresh your library to check." };
    }
    // An already-removed entry is also a successful retry, without exposing other owners.
    revalidatePath("/library");
    revalidatePath("/profile");
    revalidatePath("/media/[type]/[id]", "page");
    return { removedId: entryId };
  } catch {
    return { error: "Couldn’t confirm removal. Try again or refresh your library to check." };
  }
}

export async function updateLibraryEntry(entryId: string, changes: Pick<SaveLibraryInput, "rating" | "status" | "progress">): Promise<SaveLibraryResult> {
  if (typeof entryId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryId) || !changes || typeof changes !== "object") return { error: "Choose a valid library entry to edit." };
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Your session expired. Sign in again before saving changes." };
    const current = await supabase.from("library_entries").select(librarySelection).eq("id", entryId).eq("user_id", user.id).maybeSingle();
    if (current.error) return { error: "Couldn’t load this entry. Please try again." };
    if (!current.data) return { error: "This entry is no longer in your library. Refresh your library to check." };
    const existing = toLibraryEntry(current.data as unknown as LibraryRecord);
    const invalid = validateLibraryInput({ ...changes, requestId: entryId, tmdbId: existing.tmdbId, mediaType: existing.mediaType });
    if (invalid) return { error: invalid };
    let progress;
    if (changes.progress) {
      const next = changes.progress;
      if (existing.progress?.episodeId === next.episodeId && existing.progress.seasonNumber === next.seasonNumber && existing.progress.episodeNumber === next.episodeNumber) {
        progress = existing.progress;
      } else {
        const token = process.env.TMDB_READ_ACCESS_TOKEN;
        if (!token) return { error: "Episode verification is unavailable. Your edits are still here; try again later." };
        const response = await fetch(`https://api.themoviedb.org/3/tv/${existing.tmdbId}/season/${next.seasonNumber}?language=en-US`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          signal: AbortSignal.timeout(8000), cache: "no-store",
        });
        if (!response.ok) return { error: "Couldn’t verify that episode. Your edits are still here; please try again." };
        const season = await response.json();
        progress = normalizeEpisodes(season.episodes, next.seasonNumber).find((item) => item.episodeId === next.episodeId && item.episodeNumber === next.episodeNumber);
        if (!progress) return { error: "That episode doesn’t match this show. Please choose the episode again." };
      }
    }
    const updated = await supabase.from("library_entries").update({
      rating: changes.rating, viewing_status: changes.status === "Completed" ? "completed" : "in_progress",
      episode_id: progress?.episodeId ?? null, season_number: progress?.seasonNumber ?? null,
      episode_number: progress?.episodeNumber ?? null, episode_name: progress?.episodeName ?? null,
    }).eq("id", entryId).eq("user_id", user.id).select("id").maybeSingle();
    if (updated.error) return { error: storageLimitMessage(updated.error) ?? "Couldn’t save your changes. Your edits are still here; please try again." };
    if (!updated.data) return { error: "This entry is no longer available. Refresh your library to check." };
    const saved = await supabase.from("library_entries").select(librarySelection).eq("id", entryId).eq("user_id", user.id).single();
    if (saved.error || !saved.data) return { error: "Your changes may have saved, but confirmation failed. Try again or refresh your library to check." };
    revalidatePath("/library");
    revalidatePath("/profile");
    revalidatePath("/media/[type]/[id]", "page");
    return { entry: toLibraryEntry(saved.data as unknown as LibraryRecord) };
  } catch {
    return { error: "Couldn’t confirm your changes. Your edits are still here; try again or refresh your library to check." };
  }
}

export async function setTitleFavourite(entryId: string, favourite: boolean): Promise<SaveLibraryResult> {
  if (typeof entryId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryId) || typeof favourite !== "boolean") return { error: "Choose a valid library title." };
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Sign in again before updating your favourites." };
    const updated = await supabase.from("library_entries").update({ is_favourite: favourite }).eq("id", entryId).eq("user_id", user.id).select("id").maybeSingle();
    if (updated.error) return { error: "Couldn’t update your favourites. Please try again." };
    if (!updated.data) return { error: "This title is no longer in your library. Refresh to check." };
    const check = await supabase.from("library_entries").select(librarySelection).eq("id", entryId).eq("user_id", user.id).single();
    if (check.error || !check.data || check.data.is_favourite !== favourite) return { error: "Couldn’t confirm your favourite. Try again or refresh to check." };
    revalidatePath("/library");
    revalidatePath("/profile");
    revalidatePath("/media/[type]/[id]", "page");
    return { entry: toLibraryEntry(check.data as unknown as LibraryRecord) };
  } catch { return { error: "Couldn’t confirm your favourite. Try again or refresh to check." }; }
}
