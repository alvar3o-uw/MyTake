export const REVIEW_LIMIT = 10000;

export function normalizeReview(input: unknown): { review: string | null; error?: never } | { error: string; review?: never } {
  if (typeof input !== "string") return { error: "Enter your review as text." };
  const review = input.replace(/\r\n?/g, "\n").trim();
  if (review.length > REVIEW_LIMIT) return { error: "Keep your review within 10,000 characters." };
  return { review: review || null };
}
