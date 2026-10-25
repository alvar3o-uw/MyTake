export type SeasonOption = { number: number; name: string };
export type EpisodeProgress = { episodeId: number; seasonNumber: number; episodeNumber: number; episodeName: string };

export function normalizeSeasons(input: unknown): SeasonOption[] {
  if (!Array.isArray(input)) return [];
  return input.filter((season) => season && Number.isSafeInteger(season.season_number) && season.season_number >= 0 && season.episode_count > 0)
    .map((season) => ({ number: season.season_number, name: typeof season.name === "string" && season.name.trim() ? season.name : season.season_number === 0 ? "Specials" : `Season ${season.season_number}` }))
    .sort((a, b) => a.number - b.number);
}

export function normalizeEpisodes(input: unknown, seasonNumber: number): EpisodeProgress[] {
  if (!Array.isArray(input)) return [];
  return input.filter((episode) => episode && Number.isSafeInteger(episode.id) && episode.id > 0 && Number.isSafeInteger(episode.episode_number) && episode.episode_number >= 0 && episode.season_number === seasonNumber)
    .map((episode) => ({ episodeId: episode.id, seasonNumber, episodeNumber: episode.episode_number, episodeName: typeof episode.name === "string" ? episode.name : "" }))
    .sort((a, b) => a.episodeNumber - b.episodeNumber);
}

export function progressLabel(status: "In Progress" | "Completed", progress?: EpisodeProgress) {
  if (status === "Completed" || !progress) return status;
  const season = progress.seasonNumber === 0 ? "Specials" : `S${progress.seasonNumber}`;
  return `${status} · Through ${season} E${String(progress.episodeNumber).padStart(2, "0")}`;
}

export type EpisodeDetails = EpisodeProgress & { overview: string; stillPath: string | null };

export function normalizeEpisodeDetails(input: unknown, seasonNumber: number): EpisodeDetails[] {
  const episodes = normalizeEpisodes(input, seasonNumber);
  if (!Array.isArray(input)) return [];
  const metadata = new Map(input.filter(item => item && typeof item === "object").map(item => [item.id, item]));
  return episodes.map(episode => {
    const item = metadata.get(episode.episodeId);
    return { ...episode,
      overview: typeof item?.overview === "string" ? item.overview.trim() : "",
      stillPath: typeof item?.still_path === "string" && /^\/[a-zA-Z0-9._-]+$/.test(item.still_path) ? item.still_path : null,
    };
  });
}
