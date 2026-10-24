import { createClient } from "@/lib/supabase/server";
import { normalizeEpisodes, normalizeSeasons } from "@/lib/tmdb/episodes";

export async function GET(request: Request) {
  const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  const params = new URL(request.url).searchParams;
  const show = params.get("show") ?? "";
  const season = params.get("season");
  if (!/^[1-9]\d{0,9}$/.test(show) || (season !== null && !/^\d{1,5}$/.test(season))) return reply({ error: "Choose a valid show and season." }, 400);
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return reply({ error: "Sign in again to load episodes." }, 401);
    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    if (!token) return reply({ error: "Episode details are unavailable. Please try again later." }, 503);
    const path = season === null ? `tv/${show}` : `tv/${show}/season/${Number(season)}`;
    const response = await fetch(`https://api.themoviedb.org/3/${path}?language=en-US`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(8000), cache: "no-store",
    });
    if (!response.ok) return reply({ error: "Couldn’t load episode details. Please try again." }, 503);
    const data = await response.json();
    if (season === null) {
      if (!Array.isArray(data.seasons)) return reply({ error: "Couldn’t load seasons. Please try again." }, 502);
      return reply({ seasons: normalizeSeasons(data.seasons) });
    }
    if (!Array.isArray(data.episodes)) return reply({ error: "Couldn’t load episodes. Please try again." }, 502);
    return reply({ episodes: normalizeEpisodes(data.episodes, Number(season)) });
  } catch {
    return reply({ error: "Couldn’t load episode details. Check your connection and try again." }, 503);
  }
}
