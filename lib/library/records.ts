import type { LibraryEntry } from "../../app/types";

export const librarySelection = "id,is_favourite,rating,viewing_status,episode_id,season_number,episode_number,episode_name,media_snapshots!inner(tmdb_id,media_type,title,release_year,poster_path)";

export type LibraryRecord = {
  id: string; is_favourite?: boolean; rating: number | null; viewing_status: "in_progress" | "completed";
  episode_id: number | null; season_number: number | null;
  episode_number: number | null; episode_name: string | null;
  media_snapshots: { tmdb_id: number; media_type: "movie" | "tv"; title: string; release_year: string; poster_path: string | null };
};

export function toLibraryEntry(record: LibraryRecord): LibraryEntry {
  const media = record.media_snapshots;
  return {
    id: record.id, isFavourite: record.is_favourite ?? false, title: media.title, tmdbId: media.tmdb_id,
    mediaType: media.media_type, year: media.release_year,
    posterPath: media.poster_path, type: media.media_type === "movie" ? "Movie" : "TV Show",
    rating: record.rating === null ? null : Number(record.rating),
    status: record.viewing_status === "completed" ? "Completed" : "In Progress",
    progress: record.episode_id === null ? undefined : {
      episodeId: record.episode_id, seasonNumber: record.season_number!,
      episodeNumber: record.episode_number!, episodeName: record.episode_name!,
    },
  };
}
