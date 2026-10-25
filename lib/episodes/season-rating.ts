export function validateSeasonRating(entryId: unknown, season: unknown, rating: unknown): string | null {
  if (typeof entryId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entryId)) return "Choose a valid saved show.";
  if (typeof season !== "number" || !Number.isInteger(season) || season < 0 || season > 99999) return "Choose a valid season.";
  if (rating !== null && (typeof rating !== "number" || !Number.isFinite(rating) || rating < 0 || rating > 10 || Number(rating.toFixed(1)) !== rating)) return "Enter a rating from 0 to 10 in steps of 0.1, or leave it blank.";
  return null;
}
export type SeasonHighlight = { number: number; name: string; rating: number };
