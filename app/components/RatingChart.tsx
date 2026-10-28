"use client";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { navigateWithUnsavedCheck } from "./useUnsavedChanges";
import { useRouter } from "next/navigation";
import type { EpisodeDetails } from "@/lib/tmdb/episodes";
import styles from "./RatingChart.module.css";
export type RatingPoint = { label: string; name: string; rating: number | null; number: number; episodeCount: number; episodes?: EpisodeScore[] };
export type EpisodeScore = { season: number; episode: number; rating: number };
const bands = ["9–10", "8–8.9", "7–7.9", "5–6.9", "3–4.9", "0–2.9"];
function band(score: number) { return score >= 9 ? 0 : score >= 8 ? 1 : score >= 7 ? 2 : score >= 5 ? 3 : score >= 3 ? 4 : 5; }
export default function RatingChart({ points: allPoints, showId, query = "" }: { points: RatingPoint[]; showId: number; query?: string }) {
  const router = useRouter();
  const requests = useRef(new Map<number, Promise<EpisodeDetails[]>>());
  const [details, setDetails] = useState<Record<string, EpisodeDetails>>({});
  const [error, setError] = useState("");
  const [hover, setHover] = useState<{ season: number; episode: number; left: number; top: number } | null>(null);
  function loadSeason(season: number) {
    const cached = requests.current.get(season);
    if (cached) return cached;
    const request = fetch(`/api/media/episodes?show=${showId}&season=${season}`).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error("Couldn’t load this episode. Please try again.");
      const items: EpisodeDetails[] = data.episodes;
      setDetails(previous => ({ ...previous, ...Object.fromEntries(items.map(item => [`${season}:${item.episodeNumber}`, item])) }));
      return items;
    }).catch(error => { requests.current.delete(season); throw error; });
    requests.current.set(season, request);
    return request;
  }
  function href(season: number, episodeId?: number) {
    const params = new URLSearchParams(query);
    params.set("season", String(season));
    if (episodeId) params.set("episode", String(episodeId));
    return `/media/tv/${showId}/episodes?${params}`;
  }
  const points = allPoints.filter(point => point.number > 0);
  const episodes = points.flatMap(point => point.episodes ?? []);
  if (!points.some(point => point.rating !== null) && !episodes.length) return null;
  const scores = new Map(episodes.map(item => [`${item.season}:${item.episode}`, item.rating]));
  const count = Math.max(0, ...points.map(point => point.episodeCount), ...episodes.map(item => item.episode));
  return <section className={styles.chart} aria-label="Your season and episode ratings">
    <h2>Your Ratings</h2>
    {error && <p role="alert">{error}</p>}
    <ul className={styles.legend} aria-label="Rating colour ranges">{bands.map((label, index) => <li key={label}><span data-band={index} />{label}</li>)}</ul>
    <div className={styles.scroll} tabIndex={0} onScroll={() => setHover(null)} aria-label="Season and episode ratings. Scroll to explore.">
      <table><caption>Your scores out of 10. A dash means unrated; empty cells mean no episode.</caption>
        <thead><tr><th scope="col">Episode</th>{points.map(point => <th scope="col" key={point.number}><span title={point.name}>{point.label}</span>{points.length > 1 ? <Link href={href(point.number)} className={styles.seasonScore} data-band={point.rating === null ? undefined : band(point.rating)} aria-label={`Edit ${point.name} season rating: ${point.rating ?? "unrated"}`}>{point.rating?.toFixed(1) ?? "—"}</Link> : <div className={styles.seasonScore}>{point.rating?.toFixed(1) ?? "—"}</div>}</th>)}</tr></thead>
        <tbody>{Array.from({ length: count }, (_, index) => index + 1).map(episode => <tr key={episode}><th scope="row">E{episode}</th>{points.map(point => {
          const score = scores.get(`${point.number}:${episode}`);
          return <td key={point.number}>{(episode <= point.episodeCount || score !== undefined) && <button type="button" className={styles.cell} data-band={score === undefined ? undefined : band(score)} aria-label={`Edit ${point.label} episode ${episode} rating, ${score ?? "unrated"}`} onMouseLeave={() => setHover(null)} onMouseEnter={event => {
            const rect = event.currentTarget.getBoundingClientRect();
            setHover({ season: point.number, episode, left: Math.max(8, Math.min(rect.left, window.innerWidth - 260)), top: rect.bottom + 235 < window.innerHeight ? rect.bottom + 8 : Math.max(8, rect.top - 235) });
            void loadSeason(point.number).catch(() => {});
          }} onClick={async () => {
            setHover(null);
            setError("");
            try {
              const item = (await loadSeason(point.number)).find(item => item.episodeNumber === episode);
              if (!item) throw new Error("That episode is no longer listed. Please reload the page.");
              navigateWithUnsavedCheck(() => router.push(href(point.number, item.episodeId)));
            } catch (error) { setError(error instanceof Error ? error.message : "Couldn’t open this episode. Please try again."); }
          }}>{score?.toFixed(1) ?? "—"}</button>}</td>;
        })}</tr>)}</tbody>
      </table>
    </div>
    {hover && createPortal(<div className={styles.tooltip} style={{ left: hover.left, top: hover.top }}>
      {details[`${hover.season}:${hover.episode}`]?.stillPath ? <Image src={`https://image.tmdb.org/t/p/w300${details[`${hover.season}:${hover.episode}`].stillPath}`} width={240} height={135} alt="" unoptimized /> : <span className={styles.noStill}>{details[`${hover.season}:${hover.episode}`] ? "No episode image" : "Loading episode…"}</span>}
      <strong>{details[`${hover.season}:${hover.episode}`]?.episodeName || `Episode ${hover.episode}`}</strong><small>S{hover.season} · E{hover.episode} · {scores.get(`${hover.season}:${hover.episode}`)?.toFixed(1) ?? "Unrated"}</small>
    </div>, document.body)}
  </section>;
}
