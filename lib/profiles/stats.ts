import type { LibraryEntry } from "../../app/types";

export function titleStats(entries: LibraryEntry[]) {
  const rated = entries.filter(entry => entry.rating !== null);
  const distribution = Array<number>(11).fill(0);
  for (const entry of rated) distribution[Math.floor(entry.rating!)] += 1;
  return {
    moviesRated: rated.filter(entry => entry.mediaType === "movie").length,
    showsRated: rated.filter(entry => entry.mediaType === "tv").length,
    showsCompleted: entries.filter(entry => entry.mediaType === "tv" && entry.status === "Completed").length,
    showsInProgress: entries.filter(entry => entry.mediaType === "tv" && entry.status === "In Progress").length,
    averageRating: rated.length ? rated.reduce((sum, entry) => sum + entry.rating!, 0) / rated.length : null,
    distribution,
  };
}
export type RankedSeason = { entryId: string; showId: number; showTitle: string; season: number; name: string; rating: number; imagePath: string | null };
export type RankedEpisode = RankedSeason & { episodeId: number; episode: number };
export type ProfileStats = { seasonsRated: number; genreNames: Record<string, string[]>; episodesRated: number; reviewsWritten: number; topSeasons: RankedSeason[]; topEpisodes: RankedEpisode[] };

export function genreStats(entries: LibraryEntry[], names: Record<string, string[]>) {
  const rated = entries.filter(entry => entry.rating !== null);
  const groups = new Map<string, { name: string; count: number; total: number }>();
  let coveredTitles = 0;
  for (const entry of rated) {
    const genres = [...new Set((names[entry.id] ?? []).map(name => name.trim()).filter(Boolean))];
    if (genres.length) coveredTitles += 1;
    for (const name of genres) {
      const group = groups.get(name) ?? { name, count: 0, total: 0 };
      group.count += 1;
      group.total += entry.rating!;
      groups.set(name, group);
    }
  }
  const averages = [...groups.values()].map(group => ({ name: group.name, count: group.count, average: group.total / group.count }));
  const alphabetically = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  return {
    coveredTitles, ratedTitles: rated.length,
    mostRated: [...averages].sort((a, b) => b.count - a.count || b.average - a.average || alphabetically(a,b)).slice(0,5),
    highestRated: [...averages].sort((a,b) => b.average - a.average || b.count - a.count || alphabetically(a,b)).slice(0,5),
  };
}
