import type { EpisodeProgress } from "@/lib/tmdb/episodes";
import type { MediaResult } from "@/lib/tmdb/media";

export type NewEntry = MediaResult & {
  rating: number | null;
  type: "Movie" | "TV Show";
  status: "In Progress" | "Completed";
  progress?: EpisodeProgress;
};

export type LibraryEntry = NewEntry & { id: string };
