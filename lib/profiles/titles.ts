import type { LibraryEntry } from "../../app/types";

export type ProfileFilter = "all" | "movie" | "tv";
export function profileTitles(entries: LibraryEntry[], filter: ProfileFilter) {
  const filtered = entries.filter(entry => filter === "all" || entry.mediaType === filter);
  const byTitle = (a: LibraryEntry, b: LibraryEntry) => a.title.localeCompare(b.title, "en", { sensitivity: "base", numeric: true });
  return {
    favourites: filtered.filter(entry => entry.isFavourite).sort(byTitle),
    highestRated: filtered.filter(entry => entry.rating !== null).sort((a, b) => b.rating! - a.rating! || byTitle(a, b)).slice(0, 4),
  };
}
