"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeEpisodes, normalizeSeasons, type EpisodeProgress } from "@/lib/tmdb/episodes";
import { validateSeasonRating } from "@/lib/episodes/season-rating";
import { validateLibraryInput } from "@/lib/library/input";

export async function saveEpisodeRating(entryId: string, episode: EpisodeProgress, rating: number | null): Promise<{ error?: string; rating?: number | null }> {
  const invalid = validateLibraryInput({ requestId: entryId, tmdbId: 1, mediaType: "tv", status: "In Progress", progress: episode, rating });
  if (invalid) return { error: invalid };
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Sign in again before saving your rating." };
    const { data: entry, error } = await supabase.from("library_entries").select("media_snapshots!inner(tmdb_id)").eq("id", entryId).eq("user_id", user.id).eq("media_type", "tv").maybeSingle();
    if (error || !entry) return { error: "This show is no longer in your library. Refresh to check." };
    const showId = (entry as unknown as { media_snapshots: { tmdb_id: number } }).media_snapshots.tmdb_id;
    // Clearing a saved opinion does not depend on catalogue availability.
    if (rating !== null) {
      const token = process.env.TMDB_READ_ACCESS_TOKEN;
      if (!token) return { error: "Episode details are unavailable. Try again later." };
      const response = await fetch(`https://api.themoviedb.org/3/tv/${showId}/season/${episode.seasonNumber}?language=en-US`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return { error: "Couldn’t verify this episode. Please try again." };
      const data = await response.json();
      const canonical = normalizeEpisodes(data.episodes, episode.seasonNumber).find(item => item.episodeId === episode.episodeId && item.episodeNumber === episode.episodeNumber);
      if (!canonical) return { error: "That episode doesn’t match this show. Reload the episode list." };
    }
    const saved = await supabase.rpc("save_episode_rating", { p_entry_id: entryId, p_episode_id: episode.episodeId, p_season_number: episode.seasonNumber, p_episode_number: episode.episodeNumber, p_rating: rating });
    if (saved.error) return { error: "Couldn’t confirm your save. Try again or refresh to check." };
    const check = await supabase.from("episode_ratings").select("rating").eq("entry_id", entryId).eq("episode_id", episode.episodeId).maybeSingle();
    if (check.error || (rating === null ? check.data !== null : !check.data || Number(check.data.rating) !== rating)) return { error: "Couldn’t confirm your save. Your draft is still here; try again or refresh." };
    revalidatePath(`/media/tv/${showId}/episodes`);
    revalidatePath("/profile");
    revalidatePath(`/media/tv/${showId}`);
    return { rating: check.data ? Number(check.data.rating) : null };
  } catch { return { error: "Couldn’t confirm your save. Your draft is still here; try again or refresh." }; }
}

export async function setFavouriteEpisode(entryId: string, episode: EpisodeProgress, starred: boolean): Promise<{ error?: string; favouriteId?: number | null }> {
  const invalid = validateLibraryInput({ requestId: entryId, tmdbId: 1, mediaType: "tv", status: "In Progress", progress: episode, rating: null });
  if (invalid || typeof starred !== "boolean") return { error: invalid || "Choose an episode to star." };
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Sign in again before changing your favourite." };
    const { data: entry, error } = await supabase.from("library_entries").select("media_snapshots!inner(tmdb_id)").eq("id", entryId).eq("user_id", user.id).eq("media_type", "tv").maybeSingle();
    if (error || !entry) return { error: "This show is no longer in your library. Refresh to check." };
    const showId = (entry as unknown as { media_snapshots: { tmdb_id: number } }).media_snapshots.tmdb_id;
    if (starred) {
      const token = process.env.TMDB_READ_ACCESS_TOKEN;
      if (!token) return { error: "Episode details are unavailable. Try again later." };
      const response = await fetch(`https://api.themoviedb.org/3/tv/${showId}/season/${episode.seasonNumber}?language=en-US`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return { error: "Couldn’t verify this episode. Please try again." };
      const data = await response.json();
      if (!normalizeEpisodes(data.episodes, episode.seasonNumber).some(item => item.episodeId === episode.episodeId && item.episodeNumber === episode.episodeNumber)) return { error: "That episode doesn’t match this show. Reload the list." };
      const saved = await supabase.rpc("set_favourite_episode", { p_entry_id: entryId, p_episode_id: episode.episodeId, p_season_number: episode.seasonNumber, p_episode_number: episode.episodeNumber });
      if (saved.error) return { error: "Couldn’t confirm your favourite. Try again or refresh to check." };
    } else {
      // A stale unstar must not remove a different favourite chosen in another tab.
      const removed = await supabase.from("episode_favourites").delete().eq("entry_id", entryId).eq("episode_id", episode.episodeId);
      if (removed.error) return { error: "Couldn’t remove the star. Please try again." };
    }
    const check = await supabase.from("episode_favourites").select("episode_id").eq("entry_id", entryId).maybeSingle();
    if (check.error || (starred && check.data?.episode_id !== episode.episodeId)) return { error: "Couldn’t confirm your favourite. Refresh to check." };
    revalidatePath(`/media/tv/${showId}`);
    revalidatePath(`/media/tv/${showId}/episodes`);
    revalidatePath("/profile");
    return { favouriteId: check.data?.episode_id ?? null };
  } catch { return { error: "Couldn’t confirm your favourite. Try again or refresh to check." }; }
}

export async function saveSeasonRating(entryId: string, season: number, rating: number | null): Promise<{ error?: string; rating?: number | null }> {
  const invalid = validateSeasonRating(entryId, season, rating);
  if (invalid) return { error: invalid };
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Sign in again before saving your season rating." };
    const current = await supabase.from("library_entries").select("media_snapshots!inner(tmdb_id)").eq("id", entryId).eq("user_id", user.id).eq("media_type", "tv").maybeSingle();
    if (current.error || !current.data) return { error: "This show is no longer in your library. Refresh to check." };
    const showId = (current.data as unknown as { media_snapshots: { tmdb_id: number } }).media_snapshots.tmdb_id;
    if (rating !== null) {
      const token = process.env.TMDB_READ_ACCESS_TOKEN;
      if (!token) return { error: "Season details are unavailable. Try again later." };
      const response = await fetch(`https://api.themoviedb.org/3/tv/${showId}?language=en-US`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!response.ok) return { error: "Couldn’t verify this season. Please try again." };
      const details = await response.json();
      const seasons = normalizeSeasons(details.seasons);
      if (seasons.filter(item => item.number > 0).length <= 1) return { error: "Season ratings are only available for shows with more than one season." };
      if (!seasons.some(item => item.number === season)) return { error: "That season doesn’t match this show. Reload the season list." };
    }
    const saved = await supabase.rpc("save_season_rating", { p_entry_id: entryId, p_season_number: season, p_rating: rating });
    if (saved.error) return { error: "Couldn’t confirm your rating. Your draft is still here; try again or refresh." };
    const check = await supabase.from("season_ratings").select("rating").eq("entry_id", entryId).eq("season_number", season).maybeSingle();
    if (check.error || (check.data ? Number(check.data.rating) : null) !== rating) return { error: "Couldn’t confirm your rating. Try again or refresh to check." };
    revalidatePath(`/media/tv/${showId}`);
    revalidatePath(`/media/tv/${showId}/episodes`);
    revalidatePath("/profile");
    return { rating: check.data ? Number(check.data.rating) : null };
  } catch { return { error: "Couldn’t confirm your rating. Your draft is still here; try again or refresh." }; }
}
