export const STORAGE_CAPS = {
  titles: 1000,
  episode_ratings: 10000,
  season_ratings: 1000,
  episode_reviews: 2000,
  text: 1000000,
} as const;

export function storageLimitMessage(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("message" in error) || !("code" in error) || error.code !== "MTLIM") return null;
  if (error.message === "episode_ratings") return `You’ve reached the limit of ${STORAGE_CAPS.episode_ratings.toLocaleString("en-US")} episode ratings. Clear some to rate more.`;
  if (error.message === "season_ratings") return `You’ve reached the limit of ${STORAGE_CAPS.season_ratings.toLocaleString("en-US")} season ratings. Clear some to rate more.`;
  if (error.message === "episode_reviews") return `You’ve reached the limit of ${STORAGE_CAPS.episode_reviews.toLocaleString("en-US")} episode reviews. Remove some to add more.`;
  if (error.message === "text") return `Your saved text has reached MyTake’s ${STORAGE_CAPS.text / 1_000_000} MB limit (reviews, titles and episode names together). Shorten or remove a review, or remove a title, to save more.`;
  if (error.message === "titles") return `You’ve reached MyTake’s limit of ${STORAGE_CAPS.titles.toLocaleString("en-US")} saved titles (library and watchlist together). Remove a title to add another.`;
  return null;
}
