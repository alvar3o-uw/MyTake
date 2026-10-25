import { notFound, redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/profiles/server";
import { librarySelection, toLibraryEntry, type LibraryRecord } from "@/lib/library/records";
import { normalizeEpisodeDetails } from "@/lib/tmdb/episodes";
import type { EpisodeHighlight } from "@/lib/episodes/highlights";
import MediaDetails from "./MediaDetails";

export default async function MediaPage({ params, searchParams }: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ filter?: string; order?: string }>;
}) {
  const { profile, supabase, id: ownerId } = await getOwnProfile();
  if (!profile) redirect("/profile/setup");
  const { type, id } = await params;
  if ((type !== "movie" && type !== "tv") || !/^[1-9]\d{0,9}$/.test(id) || Number(id) > 2147483647) notFound();
  const { data, error } = await supabase.from("library_entries").select(`${librarySelection},review`)
    .eq("user_id", ownerId).eq("media_snapshots.media_type", type).eq("media_snapshots.tmdb_id", Number(id)).maybeSingle();
  if (error) throw new Error("Unable to load your saved entry.");
  if (!data) notFound();
  const entry = toLibraryEntry(data as unknown as LibraryRecord);
  let overview = "";
  let genres: string[] = [];
  let runtime: number | null = null;
  let catalogueUnavailable = false;
  try {
    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    if (!token) throw new Error("Catalogue unavailable");
    const response = await fetch(`https://api.themoviedb.org/3/${type}/${id}?language=en-US`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Catalogue unavailable");
    const details = await response.json();
    if (details.id !== Number(id)) throw new Error("Unexpected catalogue result");
    overview = typeof details.overview === "string" ? details.overview.trim() : "";
    genres = Array.isArray(details.genres) ? details.genres.flatMap((genre: { name?: unknown } | null) => genre && typeof genre.name === "string" ? [genre.name] : []) : [];
    runtime = type === "movie" && Number.isInteger(details.runtime) && details.runtime > 0 ? details.runtime : null;
  } catch { catalogueUnavailable = true; }
  let topEpisodes: EpisodeHighlight[] = [];
  let favouriteEpisode: EpisodeHighlight | null = null;
  let highlightsUnavailable = false;
  if (type === "tv") {
    const [top, favourite] = await Promise.all([
      supabase.from("episode_ratings").select("episode_id,season_number,episode_number,rating").eq("entry_id", entry.id).order("rating", { ascending: false }).order("season_number").order("episode_number").limit(3),
      supabase.from("episode_favourites").select("episode_id,season_number,episode_number").eq("entry_id", entry.id).maybeSingle(),
    ]);
    highlightsUnavailable = Boolean(top.error || favourite.error);
    if (!highlightsUnavailable) {
      const rows = [...(top.data ?? []), ...(favourite.data ? [favourite.data] : [])];
      const metadata = new Map<number, ReturnType<typeof normalizeEpisodeDetails>[number]>();
      await Promise.all([...new Set(rows.map(row => row.season_number))].map(async season => {
        try {
          const token = process.env.TMDB_READ_ACCESS_TOKEN;
          if (!token) return;
          const response = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${season}?language=en-US`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
          if (!response.ok) return;
          const data = await response.json();
          for (const episode of normalizeEpisodeDetails(data.episodes, season)) metadata.set(episode.episodeId, episode);
        } catch { /* Saved episode coordinates remain readable if the catalogue is unavailable. */ }
      }));
      const highlight = (row: { episode_id: number; season_number: number; episode_number: number }, rating: number | null): EpisodeHighlight => ({
        episodeId: row.episode_id, seasonNumber: row.season_number, episodeNumber: row.episode_number,
        title: metadata.get(row.episode_id)?.episodeName || `Episode ${row.episode_number}`,
        stillPath: metadata.get(row.episode_id)?.stillPath ?? null, rating,
      });
      topEpisodes = (top.data ?? []).map(row => highlight(row, Number(row.rating)));
      if (favourite.data) {
        const score = await supabase.from("episode_ratings").select("rating").eq("entry_id", entry.id).eq("episode_id", favourite.data.episode_id).maybeSingle();
        if (score.error) highlightsUnavailable = true;
        else favouriteEpisode = highlight(favourite.data, score.data ? Number(score.data.rating) : null);
      }
    }
  }
  const query = await searchParams;
  const back = new URLSearchParams();
  if (query.filter === "movie" || query.filter === "tv") back.set("filter", query.filter);
  if (["ascending", "alphabetical", "alphabetical-reverse"].includes(query.order ?? "")) back.set("order", query.order!);
  return <MediaDetails initialReview={(data as unknown as { review: string | null }).review} topEpisodes={topEpisodes} favouriteEpisode={favouriteEpisode} highlightsUnavailable={highlightsUnavailable} key={entry.id} username={profile.username} initialEntry={entry} overview={overview} genres={genres} runtime={runtime} catalogueUnavailable={catalogueUnavailable} backHref={`/library${back.size ? `?${back}` : ""}`} />;
}
