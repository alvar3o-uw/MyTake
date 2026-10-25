import { redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/profiles/server";
import { librarySelection, toLibraryEntry, type LibraryRecord } from "@/lib/library/records";
import { loadProfileGenres } from "@/lib/profiles/genres";
import { normalizeEpisodeDetails } from "@/lib/tmdb/episodes";
import type { RankedSeason, RankedEpisode } from "@/lib/profiles/stats";
import Profile from "./Profile";

export default async function ProfilePage() {
  const { profile, supabase, id } = await getOwnProfile();
  if (!profile) redirect("/profile/setup");
  const { data, error } = await supabase.from("library_entries").select(`${librarySelection},review`).eq("user_id", id);
  if (error) throw new Error("Unable to load your profile titles.");
  const entries = (data as unknown as LibraryRecord[]).map(toLibraryEntry);
  const genrePromise = loadProfileGenres(entries);
  const relation = "library_entries!inner(user_id,media_snapshots!inner(tmdb_id,title,poster_path))";
  const [episodes, seasons, reviews] = await Promise.all([
    supabase.from("episode_ratings").select(`entry_id,episode_id,season_number,episode_number,rating,${relation}`, { count: "exact" }).eq("library_entries.user_id", id).order("rating", { ascending: false }).order("season_number").order("episode_number").order("entry_id").limit(5),
    supabase.from("season_ratings").select(`entry_id,season_number,rating,${relation}`, { count: "exact" }).eq("library_entries.user_id", id).order("rating", { ascending: false }).order("season_number").order("entry_id").limit(5),
    supabase.from("episode_reviews").select("entry_id,library_entries!inner(user_id)", { count: "exact", head: true }).eq("library_entries.user_id", id),
  ]);
  if (episodes.error || seasons.error || reviews.error) throw new Error("Unable to load your profile stats.");
  type RatingRow = { entry_id: string; season_number: number; rating: number; episode_id?: number; episode_number?: number; library_entries: { media_snapshots: { tmdb_id: number; title: string; poster_path: string | null } } };
  const episodeRows = episodes.data as unknown as RatingRow[];
  const seasonRows = seasons.data as unknown as RatingRow[];
  const catalogue = new Map<string, { name: string; episodes: ReturnType<typeof normalizeEpisodeDetails> }>();
  const keys = new Map([...episodeRows, ...seasonRows].map(row => [`${row.library_entries.media_snapshots.tmdb_id}/${row.season_number}`, row]));
  await Promise.all([...keys].map(async ([key, row]) => {
    try {
      const token = process.env.TMDB_READ_ACCESS_TOKEN;
      if (!token) return;
      const response = await fetch(`https://api.themoviedb.org/3/tv/${row.library_entries.media_snapshots.tmdb_id}/season/${row.season_number}?language=en-US`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!response.ok) return;
      const details = await response.json();
      catalogue.set(key, { name: typeof details.name === "string" ? details.name : `Season ${row.season_number}`, episodes: normalizeEpisodeDetails(details.episodes, row.season_number) });
    } catch { /* Preserve saved scores and episode coordinates during catalogue outages. */ }
  }));
  function ranked(row: RatingRow): RankedSeason {
    const show = row.library_entries.media_snapshots;
    return { entryId: row.entry_id, showId: show.tmdb_id, showTitle: show.title, season: row.season_number, rating: Number(row.rating), name: row.season_number === 0 ? "Specials" : catalogue.get(`${show.tmdb_id}/${row.season_number}`)?.name || `Season ${row.season_number}`, imagePath: show.poster_path };
  }
  const topSeasons = seasonRows.map(ranked);
  const topEpisodes: RankedEpisode[] = episodeRows.map(row => {
    const result = ranked(row);
    const episode = catalogue.get(`${result.showId}/${result.season}`)?.episodes.find(item => item.episodeId === row.episode_id);
    return { ...result, episodeId: row.episode_id!, episode: row.episode_number!, name: episode?.episodeName || `Episode ${row.episode_number}`, imagePath: episode?.stillPath ?? null };
  });
  const mediaReviewCount = (data as unknown as { review: string | null }[]).filter(entry => entry.review !== null).length;
  const genreNames = await genrePromise;
  return <Profile stats={{ seasonsRated: seasons.count ?? 0, genreNames, episodesRated: episodes.count ?? 0, reviewsWritten: mediaReviewCount + (reviews.count ?? 0), topSeasons, topEpisodes }} username={profile.username} initialEntries={entries} />;
}
