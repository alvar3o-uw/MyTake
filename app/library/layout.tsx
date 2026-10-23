import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/sign-in");
  return children;
}
