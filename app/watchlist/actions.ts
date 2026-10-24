"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeResults } from "@/lib/tmdb/media";
import { normalizeEpisodes } from "@/lib/tmdb/episodes";
import { validateLibraryInput, type SaveLibraryInput } from "@/lib/library/input";
import { librarySelection, toLibraryEntry, type LibraryRecord } from "@/lib/library/records";
import { watchlistSelection, toWatchlistEntry, type WatchlistEntry, type WatchlistRecord } from "@/lib/watchlist/records";
import type { SaveLibraryResult } from "../library/actions";
async function catalogue(path: string) {
    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    if (!token)
        throw new Error("Catalogue unavailable");
    const response = await fetch(`https://api.themoviedb.org/3/${path}?language=en-US`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!response.ok)
        throw new Error("Catalogue unavailable");
    return response.json();
}
export async function saveWatchlistEntry(input: Pick<SaveLibraryInput, "requestId" | "tmdbId" | "mediaType">): Promise<{
    entry: WatchlistEntry;
    error?: never;
} | {
    error: string;
    entry?: never;
}> {
    if (!input || typeof input !== "object")
        return { error: "Choose a title to add." };
    const invalid = validateLibraryInput({ ...input, rating: null, status: "Completed", progress: undefined });
    if (invalid)
        return { error: invalid };
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user)
            return { error: "Sign in again before saving to your watchlist." };
        const existing = await supabase.from("watchlist_entries").select(watchlistSelection).eq("id", input.requestId).eq("user_id", user.id).maybeSingle();
        if (existing.error)
            return { error: "Couldn’t check your watchlist. Please try again." };
        if (existing.data)
            return { entry: toWatchlistEntry(existing.data as unknown as WatchlistRecord) };
        const raw = await catalogue(`${input.mediaType}/${input.tmdbId}`);
        const media = normalizeResults([{ ...raw, media_type: input.mediaType }])[0];
        if (!media || media.tmdbId !== input.tmdbId)
            return { error: "That title is unavailable. Choose another search result." };
        const { error } = await supabase.rpc("save_watchlist_entry", { p_entry_id: input.requestId, p_tmdb_id: media.tmdbId, p_media_type: media.mediaType, p_title: media.title, p_release_year: media.year, p_poster_path: media.posterPath });
        if (error) {
            if (error.code === "23505") {
                const retry = await supabase.from("watchlist_entries").select(watchlistSelection).eq("id", input.requestId).eq("user_id", user.id).maybeSingle();
                if (retry.data)
                    return { entry: toWatchlistEntry(retry.data as unknown as WatchlistRecord) };
                const duplicate = await supabase.from("media_snapshots").select("collection").eq("tmdb_id", input.tmdbId).eq("media_type", input.mediaType).eq("user_id", user.id).maybeSingle();
                return { error: duplicate.data?.collection === "library" ? "This title is already in your library." : "This title is already on your watchlist." };
            }
            return { error: "Couldn’t confirm the save. Try again or refresh your watchlist to check." };
        }
        const saved = await supabase.from("watchlist_entries").select(watchlistSelection).eq("id", input.requestId).eq("user_id", user.id).single();
        if (saved.error || !saved.data)
            return { error: "The title may have saved. Try again or refresh your watchlist to check." };
        revalidatePath("/watchlist");
        return { entry: toWatchlistEntry(saved.data as unknown as WatchlistRecord) };
    }
    catch {
        return { error: "Couldn’t confirm the save. Your selection is still here; try again or refresh your watchlist to check." };
    }
}
export async function removeWatchlistEntry(entryId: string, confirmed: boolean): Promise<{
    removedId?: string;
    error?: string;
}> {
    if (confirmed !== true || typeof entryId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryId))
        return { error: "Confirm which watchlist title you want to remove." };
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user)
            return { error: "Sign in again before removing this title." };
        const current = await supabase.from("watchlist_entries").select("media_id").eq("id", entryId).eq("user_id", user.id).maybeSingle();
        if (current.error)
            return { error: "Couldn’t check this title. Please try again." };
        if (current.data) {
            const removed = await supabase.from("media_snapshots").delete().eq("id", current.data.media_id).eq("user_id", user.id).eq("collection", "watchlist");
            if (removed.error)
                return { error: "Couldn’t remove this title. Please try again." };
            const check = await supabase.from("watchlist_entries").select("id").eq("id", entryId).eq("user_id", user.id).maybeSingle();
            if (check.error || check.data)
                return { error: "Couldn’t confirm removal. Try again or refresh to check." };
        }
        revalidatePath("/watchlist");
        return { removedId: entryId };
    }
    catch {
        return { error: "Couldn’t confirm removal. Try again or refresh your watchlist to check." };
    }
}
export async function moveWatchlistEntry(entryId: string, changes: Pick<SaveLibraryInput, "rating" | "status" | "progress">): Promise<SaveLibraryResult> {
    if (typeof entryId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryId) || !changes || typeof changes !== "object")
        return { error: "Choose a valid watchlist entry." };
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user)
            return { error: "Sign in again before moving this title." };
        const moved = await supabase.from("library_entries").select(librarySelection).eq("id", entryId).eq("user_id", user.id).maybeSingle();
        if (moved.error)
            return { error: "Couldn’t check your library. Please try again." };
        if (moved.data) {
            revalidatePath("/library");
            revalidatePath("/watchlist");
            return { entry: toLibraryEntry(moved.data as unknown as LibraryRecord) };
        }
        const current = await supabase.from("watchlist_entries").select(watchlistSelection).eq("id", entryId).eq("user_id", user.id).maybeSingle();
        if (current.error || !current.data)
            return { error: "This title is no longer on your watchlist. Refresh to check." };
        const media = toWatchlistEntry(current.data as unknown as WatchlistRecord);
        const invalid = validateLibraryInput({ ...changes, requestId: entryId, tmdbId: media.tmdbId, mediaType: media.mediaType });
        if (invalid)
            return { error: invalid };
        let progress;
        if (changes.progress) {
            const p = changes.progress;
            const season = await catalogue(`tv/${media.tmdbId}/season/${p.seasonNumber}`);
            progress = normalizeEpisodes(season.episodes, p.seasonNumber).find(item => item.episodeId === p.episodeId && item.episodeNumber === p.episodeNumber);
            if (!progress)
                return { error: "That episode doesn’t match this show. Select it again." };
        }
        const { error } = await supabase.rpc("move_watchlist_to_library", { p_entry_id: entryId, p_rating: changes.rating, p_viewing_status: changes.status === "Completed" ? "completed" : "in_progress", p_episode_id: progress?.episodeId ?? null, p_season_number: progress?.seasonNumber ?? null, p_episode_number: progress?.episodeNumber ?? null, p_episode_name: progress?.episodeName ?? null });
        if (error)
            return { error: "Couldn’t confirm the move. Try again or refresh both lists to check." };
        const saved = await supabase.from("library_entries").select(librarySelection).eq("id", entryId).eq("user_id", user.id).single();
        if (saved.error || !saved.data)
            return { error: "The title may have moved. Try again or refresh both lists to check." };
        revalidatePath("/library");
        revalidatePath("/watchlist");
        return { entry: toLibraryEntry(saved.data as unknown as LibraryRecord) };
    }
    catch {
        return { error: "Couldn’t confirm the move. Your selections are still here; try again or refresh both lists to check." };
    }
}
