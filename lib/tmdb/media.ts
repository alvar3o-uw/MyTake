export type MediaResult = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  year: string;
  posterPath: string | null;
};

export function normalizeResults(input: unknown): MediaResult[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item): MediaResult[] => {
    if (!item || typeof item !== "object") return [];
    const { id, media_type, title, name, release_date, first_air_date, poster_path, adult } = item;
    if (adult === true || (media_type !== "movie" && media_type !== "tv") || !Number.isSafeInteger(id) || id <= 0) return [];
    const label = media_type === "movie" ? title : name;
    if (typeof label !== "string" || !label.trim()) return [];
    const date = media_type === "movie" ? release_date : first_air_date;
    return [{
      tmdbId: id, mediaType: media_type, title: label.trim(),
      year: typeof date === "string" && /^\d{4}-/.test(date) ? date.slice(0, 4) : "",
      posterPath: typeof poster_path === "string" && /^\/[a-zA-Z0-9._-]+$/.test(poster_path) ? poster_path : null,
    }];
  }).slice(0, 10);
}

export function posterUrl(path: string, size: "w92" | "w500" = "w92") {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
