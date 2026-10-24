import type { LibraryEntry } from "../app/types";

export type LibraryOrder = "descending" | "ascending" | "alphabetical" | "alphabetical-reverse";

export function sortLibrary(entries: LibraryEntry[], order: LibraryOrder): LibraryEntry[] {
  return [...entries].sort((a, b) => {
    const byTitle = a.title.localeCompare(b.title, "en", { sensitivity: "base", numeric: true });
    if (order === "alphabetical") return byTitle;
    if (order === "alphabetical-reverse") return -byTitle;
    // Null means unrated. Zero is a real rating and must stay in the rated group.
    if (a.rating === null && b.rating === null) return byTitle;
    if (a.rating === null) return order === "ascending" ? -1 : 1;
    if (b.rating === null) return order === "ascending" ? 1 : -1;
    const byRating = order === "descending" ? b.rating - a.rating : a.rating - b.rating;
    return byRating || byTitle;
  });
}
