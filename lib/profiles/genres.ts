import "server-only";
import type { LibraryEntry } from "../../app/types";

export async function loadProfileGenres(entries: LibraryEntry[]) {
  const names: Record<string, string[]> = {};
  const rated = entries.filter(entry => entry.rating !== null);
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) return names;
  // Bound concurrency and total time. Only public catalogue responses are cached.
  const signal = AbortSignal.timeout(8000);
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(4, rated.length) }, async () => {
    while (index < rated.length) {
      const entry = rated[index++];
      try {
        const response = await fetch(`https://api.themoviedb.org/3/${entry.mediaType}/${entry.tmdbId}?language=en-US`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          cache: "force-cache", next: { revalidate: 86400 }, signal,
        });
        if (!response.ok) continue;
        const details = await response.json();
        if (details.id !== entry.tmdbId || !Array.isArray(details.genres)) continue;
        names[entry.id] = [...new Set<string>(details.genres.flatMap((genre: { name?: unknown } | null) => genre && typeof genre.name === "string" && genre.name.trim() ? [genre.name.trim()] : []))];
      } catch { /* Missing metadata is reported as incomplete coverage, never invented. */ }
    }
  }));
  return names;
}
