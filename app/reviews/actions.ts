"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeReview } from "@/lib/reviews/input";
import { validateLibraryInput } from "@/lib/library/input";
import { normalizeEpisodes, type EpisodeProgress } from "@/lib/tmdb/episodes";

const validId = (id: unknown): id is string => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export type ReviewResult = { review: string | null; error?: never } | { error: string; review?: never };

export async function saveMediaReview(entryId: string, input: unknown): Promise<ReviewResult> {
  if (!validId(entryId)) return { error: "Choose a valid library entry." };
  const parsed = normalizeReview(input);
  if (parsed.error) return { error: parsed.error };
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Sign in again before saving your review." };
    const saved = await supabase.from("library_entries").update({ review: parsed.review }).eq("id", entryId).eq("user_id", user.id).select("id").maybeSingle();
    if (saved.error) return { error: "Couldn’t save your review. Your draft is still here; please try again." };
    if (!saved.data) return { error: "This title is no longer in your library. Refresh to check." };
    const check = await supabase.from("library_entries").select("review").eq("id", entryId).eq("user_id", user.id).single();
    if (check.error || check.data.review !== parsed.review) return { error: "Couldn’t confirm your review. Try again or refresh to check." };
    revalidatePath("/media/[type]/[id]", "page");
    revalidatePath("/profile");
    return { review: check.data.review };
  } catch { return { error: "Couldn’t confirm your review. Your draft is still here; try again or refresh." }; }
}

export async function saveEpisodeReview(entryId: string, episode: EpisodeProgress, input: unknown): Promise<ReviewResult> {
  const invalid = validateLibraryInput({ requestId: entryId, tmdbId: 1, mediaType: "tv", status: "In Progress", progress: episode, rating: null });
  if (invalid || !episode) return { error: invalid || "Choose a valid episode." };
  const parsed = normalizeReview(input);
  if (parsed.error) return { error: parsed.error };
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Sign in again before saving your review." };
    const current = await supabase.from("library_entries").select("media_snapshots!inner(tmdb_id)").eq("id", entryId).eq("user_id", user.id).eq("media_type", "tv").maybeSingle();
    if (current.error || !current.data) return { error: "This show is no longer in your library. Refresh to check." };
    const showId = (current.data as unknown as { media_snapshots: { tmdb_id: number } }).media_snapshots.tmdb_id;
    if (parsed.review !== null) {
      const existing = await supabase.from("episode_reviews").select("season_number,episode_number").eq("entry_id", entryId).eq("episode_id", episode.episodeId).maybeSingle();
      if (existing.error) return { error: "Couldn’t load your review. Please try again." };
      if (!existing.data || existing.data.season_number !== episode.seasonNumber || existing.data.episode_number !== episode.episodeNumber) {
        const token = process.env.TMDB_READ_ACCESS_TOKEN;
        if (!token) return { error: "Episode details are unavailable. Your draft is still here." };
        const response = await fetch(`https://api.themoviedb.org/3/tv/${showId}/season/${episode.seasonNumber}?language=en-US`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) return { error: "Couldn’t verify this episode. Your draft is still here; try again." };
        const data = await response.json();
        if (!normalizeEpisodes(data.episodes, episode.seasonNumber).some(item => item.episodeId === episode.episodeId && item.episodeNumber === episode.episodeNumber)) return { error: "That episode doesn’t match this show. Reload the episode list." };
      }
    }
    const saved = await supabase.rpc("save_episode_review", { p_entry_id: entryId, p_episode_id: episode.episodeId, p_season_number: episode.seasonNumber, p_episode_number: episode.episodeNumber, p_review: parsed.review });
    if (saved.error) return { error: "Couldn’t confirm your review. Your draft is still here; try again or refresh." };
    const check = await supabase.from("episode_reviews").select("review").eq("entry_id", entryId).eq("episode_id", episode.episodeId).maybeSingle();
    if (check.error || (check.data?.review ?? null) !== parsed.review) return { error: "Couldn’t confirm your review. Try again or refresh to check." };
    revalidatePath(`/media/tv/${showId}/episodes`);
    revalidatePath("/profile");
    return { review: check.data?.review ?? null };
  } catch { return { error: "Couldn’t confirm your review. Your draft is still here; try again or refresh." }; }
}
