export type SaveLibraryInput = {
  requestId: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  rating: number | null;
  status: "In Progress" | "Completed";
  progress?: { episodeId: number; seasonNumber: number; episodeNumber: number };
};

export function validateLibraryInput(value: unknown): string | null {
  if (!value || typeof value !== "object") return "Choose a title before saving.";
  const entry = value as Partial<SaveLibraryInput>;
  if (typeof entry.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.requestId)) return "Couldn’t identify this save. Close the dialog and try again.";
  if (!Number.isSafeInteger(entry.tmdbId) || entry.tmdbId! <= 0 || entry.tmdbId! > 2147483647 || (entry.mediaType !== "movie" && entry.mediaType !== "tv")) return "Choose a valid title from the search results.";
  if (entry.rating !== null && (typeof entry.rating !== "number" || !Number.isFinite(entry.rating) || entry.rating < 0 || entry.rating > 10 || Number(entry.rating.toFixed(1)) !== entry.rating)) return "Enter a rating from 0 to 10 in steps of 0.1, or leave it blank.";
  if (entry.status !== "In Progress" && entry.status !== "Completed") return "Choose In Progress or Completed.";
  if (entry.progress !== undefined) {
    const p = entry.progress;
    if (entry.mediaType !== "tv" || entry.status !== "In Progress" || !p || !Number.isSafeInteger(p.episodeId) || p.episodeId <= 0 || p.episodeId > 2147483647 || !Number.isSafeInteger(p.seasonNumber) || p.seasonNumber < 0 || p.seasonNumber > 99999 || !Number.isSafeInteger(p.episodeNumber) || p.episodeNumber < 0 || p.episodeNumber > 2147483647) return "Choose a valid episode for this in-progress show.";
  }
  return null;
}
