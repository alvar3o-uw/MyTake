import { createClient } from "@/lib/supabase/server";
import { normalizeResults } from "@/lib/tmdb/media";

export async function GET(request: Request) {
  const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return reply({ results: [] });
  if (query.length > 120) return reply({ error: "Use a shorter search." }, 400);
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return reply({ error: "Sign in again to search for media." }, 401);
    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    if (!token) return reply({ error: "Media search is unavailable. Please try again later." }, 503);
    const url = new URL("https://api.themoviedb.org/3/search/multi");
    url.search = new URLSearchParams({ query, include_adult: "false", language: "en-US", page: "1" }).toString();
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(8000), cache: "no-store",
    });
    if (!response.ok) return reply({ error: response.status === 429 ? "Too many searches. Wait a moment and try again." : "Couldn’t reach the media catalogue. Please try again." }, 503);
    const data = await response.json();
    if (!Array.isArray(data.results)) return reply({ error: "Couldn’t load results. Please try again." }, 502);
    return reply({ results: normalizeResults(data.results) });
  } catch {
    return reply({ error: "Couldn’t load results. Check your connection and try again." }, 503);
  }
}
