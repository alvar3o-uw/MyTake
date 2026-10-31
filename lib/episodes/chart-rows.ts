// The episode numbers the ratings chart shows as rows: every episode up to the
// longest season, plus any rated episode beyond it. Rated numbers can reach
// 99,999, so rows are never filled in up to the highest one.
export function chartEpisodeRows(episodeCounts: number[], ratedEpisodes: number[]): number[] {
  const count = Math.max(0, ...episodeCounts);
  const rows = new Set(Array.from({ length: count }, (_, index) => index + 1));
  for (const episode of ratedEpisodes) if (episode > count) rows.add(episode);
  return [...rows].sort((a, b) => a - b);
}
