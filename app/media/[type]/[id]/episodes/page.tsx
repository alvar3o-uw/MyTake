import { notFound, redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/profiles/server";
import Episodes from "./Episodes";

export default async function EpisodesPage({ params, searchParams }: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ filter?: string; order?: string; season?: string; episode?: string }>;
}) {
  const { profile, supabase, id: ownerId } = await getOwnProfile();
  if (!profile) redirect("/profile/setup");
  const { type, id } = await params;
  if (type !== "tv" || !/^[1-9]\d{0,9}$/.test(id) || Number(id) > 2147483647) notFound();
  const { data: entry, error } = await supabase.from("library_entries").select("id,media_snapshots!inner(tmdb_id,title)").eq("user_id", ownerId).eq("media_type", "tv").eq("media_snapshots.tmdb_id", Number(id)).maybeSingle();
  if (error) throw new Error("Unable to load this show.");
  if (!entry) notFound();
  const saved = await supabase.from("episode_ratings").select("episode_id,rating").eq("entry_id", entry.id);
  if (saved.error) throw new Error("Unable to load your episode ratings.");
  const seasonRatings = await supabase.from("season_ratings").select("season_number,rating").eq("entry_id", entry.id);
  if (seasonRatings.error) throw new Error("Unable to load your season ratings.");
  const reviews = await supabase.from("episode_reviews").select("episode_id,review").eq("entry_id", entry.id);
  if (reviews.error) throw new Error("Unable to load your episode reviews.");
  const favourite = await supabase.from("episode_favourites").select("episode_id").eq("entry_id", entry.id).maybeSingle();
  if (favourite.error) throw new Error("Unable to load your favourite episode.");
  const media = entry as unknown as { id: string; media_snapshots: { title: string } };
  const query = await searchParams;
  const requestedSeason = typeof query.season === "string" && /^\d{1,5}$/.test(query.season) ? Number(query.season) : null;
  const requestedEpisode = requestedSeason !== null && typeof query.episode === "string" && /^[1-9]\d{0,9}$/.test(query.episode) && Number(query.episode) <= 2147483647 ? Number(query.episode) : null;
  const back = new URLSearchParams();
  if (query.filter === "movie" || query.filter === "tv") back.set("filter", query.filter);
  if (["ascending", "alphabetical", "alphabetical-reverse"].includes(query.order ?? "")) back.set("order", query.order!);
  return <Episodes key={`${media.id}-${requestedSeason}-${requestedEpisode}`} requestedSeason={requestedSeason} requestedEpisode={requestedEpisode} username={profile.username} entryId={media.id} showId={Number(id)} title={media.media_snapshots.title} initialSeasonRatings={Object.fromEntries(seasonRatings.data.map(row => [row.season_number, Number(row.rating)]))} initialReviews={Object.fromEntries(reviews.data.map(row => [row.episode_id, row.review]))} initialFavouriteId={favourite.data?.episode_id ?? null} initialRatings={Object.fromEntries(saved.data.map(row => [row.episode_id, Number(row.rating)]))} backHref={`/media/tv/${id}${back.size ? `?${back}` : ""}`} />;
}
