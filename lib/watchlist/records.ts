import type { MediaResult } from "../tmdb/media";
export type WatchlistEntry = MediaResult & {
    id: string;
    type: "Movie" | "TV Show";
};
export const watchlistSelection = "id,media_snapshots!inner(tmdb_id,media_type,title,release_year,poster_path)";
export type WatchlistRecord = {
    id: string;
    media_snapshots: {
        tmdb_id: number;
        media_type: "movie" | "tv";
        title: string;
        release_year: string;
        poster_path: string | null;
    };
};
export function toWatchlistEntry(record: WatchlistRecord): WatchlistEntry {
    const media = record.media_snapshots;
    return { id: record.id, tmdbId: media.tmdb_id, mediaType: media.media_type, title: media.title, year: media.release_year, posterPath: media.poster_path, type: media.media_type === "movie" ? "Movie" : "TV Show" };
}
