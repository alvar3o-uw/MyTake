import { notFound, redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/profiles/server";
import Episodes from "./Episodes";

export default async function EpisodesPage({ params, searchParams }: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ filter?: string; order?: string }>;
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
  const reviews = await supabase.from("episode_reviews").select("episode_id,review").eq("entry_id", entry.id);
  if (reviews.error) throw new Error("Unable to load your episode reviews.");
  const favourite = await supabase.from("episode_favourites").select("episode_id").eq("entry_id", entry.id).maybeSingle();
  if (favourite.error) throw new Error("Unable to load your favourite episode.");
  const media = entry as unknown as { id: string; media_snapshots: { title: string } };
  const query = await searchParams;
  const back = new URLSearchParams();
  if (query.filter === "movie" || query.filter === "tv") back.set("filter", query.filter);
  if (["ascending", "alphabetical", "alphabetical-reverse"].includes(query.order ?? "")) back.set("order", query.order!);
  return <Episodes username={profile.username} entryId={media.id} showId={Number(id)} title={media.media_snapshots.title} initialReviews={Object.fromEntries(reviews.data.map(row => [row.episode_id, row.review]))} initialFavouriteId={favourite.data?.episode_id ?? null} initialRatings={Object.fromEntries(saved.data.map(row => [row.episode_id, Number(row.rating)]))} backHref={`/media/tv/${id}${back.size ? `?${back}` : ""}`} />;
}
