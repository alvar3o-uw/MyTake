"use client";

import { useEffect, useState } from "react";
import type { EpisodeProgress, SeasonOption } from "@/lib/tmdb/episodes";
import styles from "./AddMediaDialog.module.css";

type LoadState<T> = { items: T[]; loading?: boolean; error?: string };

export default function EpisodePicker({ showId, progress, onChange }: {
  showId: number; progress?: EpisodeProgress; onChange: (progress?: EpisodeProgress) => void;
}) {
  const [seasons, setSeasons] = useState<LoadState<SeasonOption>>({ items: [], loading: true });
  const [season, setSeason] = useState(progress ? String(progress.seasonNumber) : "");
  const [episodes, setEpisodes] = useState<LoadState<EpisodeProgress>>({ items: [], loading: Boolean(progress) });
  const [seasonRetry, setSeasonRetry] = useState(0);
  const [episodeRetry, setEpisodeRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/media/episodes?show=${showId}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Couldn’t load seasons.");
        if (!controller.signal.aborted) setSeasons({ items: data.seasons });
      } catch (error) {
        if (!controller.signal.aborted) setSeasons({ items: [], error: error instanceof Error ? error.message : "Couldn’t load seasons." });
      }
    }
    void load();
    return () => controller.abort();
  }, [showId, seasonRetry]);

  useEffect(() => {
    if (season === "") return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/media/episodes?show=${showId}&season=${season}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Couldn’t load episodes.");
        if (!controller.signal.aborted) setEpisodes({ items: data.episodes });
      } catch (error) {
        if (!controller.signal.aborted) setEpisodes({ items: [], error: error instanceof Error ? error.message : "Couldn’t load episodes." });
      }
    }
    void load();
    return () => controller.abort();
  }, [showId, season, episodeRetry]);

  return <div className={styles.episodeProgress}>
    <p className={styles.progressHelp}>Last episode watched <span>Optional</span></p>
    <small>Your rating reflects your opinion through this episode.</small>
    {progress && <button type="button" className={styles.retry} onClick={() => { setSeason(""); setEpisodes({ items: [] }); onChange(undefined); }}>Clear Episode</button>}
    {seasons.loading ? <p role="status" className={styles.loadMessage}>Loading seasons…</p> : seasons.error ? <div role="status" className={styles.loadMessage}>{seasons.error} <button type="button" className={styles.retry} onClick={() => { setSeasons({ items: [], loading: true }); setSeasonRetry((value) => value + 1); }}>Try Again</button></div> : seasons.items.length === 0 ? <p role="status" className={styles.loadMessage}>No episode details are available for this show.</p> : <>
      <div className={styles.progressFields}>
        <div className={styles.field}>
          <label htmlFor="progress-season">Season</label>
          <select id="progress-season" value={season} onChange={(event) => { setSeason(event.target.value); setEpisodes({ items: [], loading: event.target.value !== "" }); onChange(undefined); }}>
            <option value="">Choose a season</option>
            {progress && !seasons.items.some((item) => item.number === progress.seasonNumber) && <option value={progress.seasonNumber}>{progress.seasonNumber === 0 ? "Specials" : `Season ${progress.seasonNumber}`}</option>}
            {seasons.items.map((item) => <option key={item.number} value={item.number}>{item.number === 0 ? "Specials" : item.name}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="progress-episode">Episode</label>
          <select id="progress-episode" disabled={season === "" || episodes.loading || episodes.items.length === 0} value={progress?.episodeId ?? ""} onChange={(event) => onChange(episodes.items.find((item) => item.episodeId === Number(event.target.value)))}>
            <option value="">{episodes.loading ? "Loading episodes…" : "Choose an episode"}</option>
            {progress && !episodes.items.some((item) => item.episodeId === progress.episodeId) && <option value={progress.episodeId}>E{progress.episodeNumber}{progress.episodeName ? ` · ${progress.episodeName}` : ""}</option>}
            {episodes.items.map((item) => <option key={item.episodeId} value={item.episodeId}>E{item.episodeNumber}{item.episodeName ? ` · ${item.episodeName}` : ""}</option>)}
          </select>
        </div>
      </div>
      {season !== "" && (episodes.error ? <div role="status" className={styles.loadMessage}>{episodes.error} <button type="button" className={styles.retry} onClick={() => { setEpisodes({ items: [], loading: true }); setEpisodeRetry((value) => value + 1); }}>Try Again</button></div> : episodes.loading ? <p role="status" className={styles.loadMessage}>Loading episodes…</p> : episodes.items.length === 0 ? <p role="status" className={styles.loadMessage}>No episodes are available for this season.</p> : null)}
    </>}
  </div>;
}
