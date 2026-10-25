import { redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/profiles/server";
import { librarySelection, toLibraryEntry, type LibraryRecord } from "@/lib/library/records";
import Library from "./Library";
import type { LibraryOrder } from "@/lib/sort-library";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ profile?: string; filter?: string; order?: string }> }) {
  const { profile, supabase, id } = await getOwnProfile();
  if (!profile) redirect("/profile/setup");
  const { data, error } = await supabase.from("library_entries").select(librarySelection).eq("user_id", id);
  if (error) throw new Error("Unable to load your library.");
  const entries = (data as unknown as LibraryRecord[]).map(toLibraryEntry);
  const params = await searchParams;
  const filter = params.filter === "movie" || params.filter === "tv" ? params.filter : "all";
  const order: LibraryOrder = params.order === "ascending" || params.order === "alphabetical" || params.order === "alphabetical-reverse" ? params.order : "descending";
  return <Library key={`${filter}-${order}`} initialEntries={entries} username={profile.username} profileUpdated={params.profile === "updated"} initialFilter={filter} initialOrder={order} />;
}
