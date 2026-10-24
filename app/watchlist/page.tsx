import { redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/profiles/server";
import { watchlistSelection, toWatchlistEntry, type WatchlistRecord } from "@/lib/watchlist/records";
import Watchlist from "./Watchlist";
export default async function WatchlistPage() {
    const { profile, supabase, id } = await getOwnProfile();
    if (!profile)
        redirect("/profile/setup");
    const { data, error } = await supabase.from("watchlist_entries").select(watchlistSelection).eq("user_id", id);
    if (error)
        throw new Error("Unable to load watchlist");
    return <Watchlist username={profile.username} initialEntries={(data as unknown as WatchlistRecord[]).map(toWatchlistEntry)}/>;
}
