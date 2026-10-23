import { redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/profiles/server";
import Library from "./Library";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ profile?: string }> }) {
  const { profile } = await getOwnProfile();
  if (!profile) redirect("/profile/setup");
  const params = await searchParams;
  return <Library username={profile.username} profileUpdated={params.profile === "updated"} />;
}
