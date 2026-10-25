"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { EpisodeDetails, SeasonOption } from "@/lib/tmdb/episodes";
import ReviewEditor from "@/app/components/ReviewEditor";
import { saveEpisodeReview } from "@/app/reviews/actions";
import CollectionHeader from "@/app/components/CollectionHeader";
import archive from "@/app/library/page.module.css";
import { saveEpisodeRating, setFavouriteEpisode } from "./actions";
import styles from "./page.module.css";

type Items<T> = { items: T[]; loading?: boolean; error?: string };
export default function Episodes({ username, entryId, showId, title, initialRatings, backHref, initialFavouriteId, initialReviews }: {
  initialReviews: Record<string, string>; initialFavouriteId: number | null; username: string; entryId: string; showId: number; title: string; initialRatings: Record<string, number>; backHref: string;
}) {
  const [seasons, setSeasons] = useState<Items<SeasonOption>>({ items: [], loading: true });
  const [season, setSeason] = useState("");
  const [episodes, setEpisodes] = useState<Items<EpisodeDetails>>({ items: [] });
  const [seasonRetry, setSeasonRetry] = useState(0);
  const [episodeRetry, setEpisodeRetry] = useState(0);
  const [favouriteId, setFavouriteId] = useState(initialFavouriteId);
  const [reviews, setReviews] = useState(initialReviews);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState(initialRatings);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, { text: string; error?: boolean }>>({});
  const [pending, setPending] = useState<number | null>(null);
  const pendingRef = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/media/episodes?show=${showId}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Couldn’t load seasons.");
        if (!controller.signal.aborted) {
          setSeasons({ items: data.seasons });
          const first = data.seasons.find((item: SeasonOption) => item.number > 0) ?? data.seasons[0];
          if (first) { setSeason(String(first.number)); setEpisodes({ items: [], loading: true }); }
        }
      } catch (error) { if (!controller.signal.aborted) setSeasons({ items: [], error: error instanceof Error ? error.message : "Couldn’t load seasons." }); }
    })();
    return () => controller.abort();
  }, [showId, seasonRetry]);
  useEffect(() => {
    if (season === "") return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/media/episodes?show=${showId}&season=${season}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Couldn’t load episodes.");
        if (!controller.signal.aborted) setEpisodes({ items: data.episodes });
      } catch (error) { if (!controller.signal.aborted) setEpisodes({ items: [], error: error instanceof Error ? error.message : "Couldn’t load episodes." }); }
    })();
    return () => controller.abort();
  }, [showId, season, episodeRetry]);

  async function save(episode: EpisodeDetails, draft: string) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(episode.episodeId);
    setMessages(previous => ({ ...previous, [episode.episodeId]: { text: "Saving…" } }));
    try {
      const result = await saveEpisodeRating(entryId, episode, draft === "" ? null : Number(draft));
      if (result.error) { setMessages(previous => ({ ...previous, [episode.episodeId]: { text: result.error!, error: true } })); return; }
      setRatings(previous => { const next = { ...previous }; if (result.rating == null) delete next[episode.episodeId]; else next[episode.episodeId] = result.rating; return next; });
      setDrafts(previous => ({ ...previous, [episode.episodeId]: result.rating == null ? "" : String(result.rating) }));
      setMessages(previous => ({ ...previous, [episode.episodeId]: { text: "" } }));
    } catch { setMessages(previous => ({ ...previous, [episode.episodeId]: { text: "Couldn’t confirm your save. Your draft is still here; try again.", error: true } })); }
    finally { pendingRef.current = false; setPending(null); }
  }
  async function star(episode: EpisodeDetails) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(episode.episodeId);
    setMessages(previous => ({ ...previous, [episode.episodeId]: { text: "Updating favourite…" } }));
    try {
      const result = await setFavouriteEpisode(entryId, episode, favouriteId !== episode.episodeId);
      if (result.error) setMessages(previous => ({ ...previous, [episode.episodeId]: { text: result.error!, error: true } }));
      else { setFavouriteId(result.favouriteId ?? null); setMessages(previous => ({ ...previous, [episode.episodeId]: { text: "" } })); }
    } catch { setMessages(previous => ({ ...previous, [episode.episodeId]: { text: "Couldn’t confirm your favourite. Please try again.", error: true } })); }
    finally { pendingRef.current = false; setPending(null); }
  }
  return <div className={archive.archive}>
    <CollectionHeader username={username} active="library" />
    <main className={styles.main}>
      <Link className={styles.back} href={backHref}>← {title}</Link>
      <div className={styles.heading}><div><p className={styles.eyebrow}>{title}</p><h1>Episodes</h1></div>
        {seasons.items.length > 0 && <div className={styles.season}><label htmlFor="episode-season">Season</label><select id="episode-season" value={season} disabled={pending !== null} onChange={event => { setSeason(event.target.value); setEpisodes({ items: [], loading: true }); }}>{seasons.items.map(item => <option key={item.number} value={item.number}>{item.number === 0 ? "Specials" : item.name}</option>)}</select></div>}
      </div>
      <p className={styles.help}>Your take on each episode. Leave a rating blank to clear it; 0 is a score.</p>
      {seasons.loading && <p role="status" className={styles.feedback}>Loading seasons…</p>}
      {seasons.error && <div role="alert" className={styles.feedback}>{seasons.error} <button type="button" onClick={() => { setSeasons({ items: [], loading: true }); setSeasonRetry(value => value + 1); }}>Try Again</button></div>}
      {!seasons.loading && !seasons.error && seasons.items.length === 0 && <p className={styles.feedback}>No seasons are available for this show.</p>}
      {episodes.loading && <p role="status" className={styles.feedback}>Loading episodes…</p>}
      {episodes.error && <div role="alert" className={styles.feedback}>{episodes.error} <button type="button" onClick={() => { setEpisodes({ items: [], loading: true }); setEpisodeRetry(value => value + 1); }}>Try Again</button></div>}
      {season !== "" && !episodes.loading && !episodes.error && episodes.items.length === 0 && <p className={styles.feedback}>No episodes are available for this season.</p>}
      <ol className={styles.list}>
        {episodes.items.map(episode => {
          const id = episode.episodeId;
          const saved = ratings[id] === undefined ? "" : String(ratings[id]);
          const draft = drafts[id] ?? saved;
          const dirty = draft !== saved;
          const message = messages[id];
          return <li key={id}><form className={styles.row} onSubmit={event => { event.preventDefault(); void save(episode, draft); }}>
            <div className={styles.episodeInfo}>
              {episode.stillPath ? <Image className={styles.thumbnail} src={`https://image.tmdb.org/t/p/w300${episode.stillPath}`} width={128} height={72} alt="" unoptimized /> : <div className={`${styles.thumbnail} ${styles.noImage}`} aria-hidden="true">E{episode.episodeNumber}</div>}
              <div><div className={styles.name}><span className={styles.number}>E{String(episode.episodeNumber).padStart(2, "0")}</span><h2>{episode.episodeName || `Episode ${episode.episodeNumber}`}</h2></div>
              <details className={styles.description}><summary>Description</summary><p>{episode.overview || "No description available for this episode."}</p></details>
              </div>
            </div>
            <div className={styles.controls}>
              <button type="button" className={`${styles.star} ${favouriteId === id ? styles.starred : ""}`} aria-pressed={favouriteId === id} aria-label={`${favouriteId === id ? "Unstar" : "Star"} episode ${episode.episodeNumber} as favourite`} disabled={pending !== null} onClick={() => void star(episode)}><svg viewBox="0 0 24 24" width="20" height="20" fill={favouriteId === id ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" /></svg></button><label className={styles.score}><span className={styles.srOnly}>Rating for episode {episode.episodeNumber}: {episode.episodeName}</span><input type="number" min="0" max="10" step="0.1" inputMode="decimal" value={draft} disabled={pending === id} onChange={event => { setDrafts(previous => ({ ...previous, [id]: event.target.value })); setMessages(previous => ({ ...previous, [id]: { text: "" } })); }} aria-describedby={message?.text ? `episode-message-${id}` : undefined} /><span aria-hidden="true">/10</span></label>
              <button type="submit" disabled={pending !== null || (!dirty && !message?.error)} aria-label={`Save rating for episode ${episode.episodeNumber}`}>{pending === id ? "Saving…" : "Save"}</button>
            </div>
            {message?.text && <p id={`episode-message-${id}`} className={message.error ? styles.error : styles.message} role={message.error ? "alert" : "status"}>{message.text}</p>}
          </form>
          <details className={styles.episodeReview}>
            <summary>{reviews[id] ? "Your Review" : "Write a Review"}</summary>
            <div className={styles.reviewBody}><ReviewEditor initialReview={reviews[id] ?? null} initialDraft={reviewDrafts[id]} label={`Your review of episode ${episode.episodeNumber}: ${episode.episodeName}`} disabled={pending !== null}
              onDraftChange={draft => setReviewDrafts(previous => ({ ...previous, [id]: draft }))}
              onSave={draft => saveEpisodeReview(entryId, episode, draft)}
              onSaved={review => setReviews(previous => { const next = { ...previous }; if (review === null) delete next[id]; else next[id] = review; return next; })}
              onPendingChange={saving => { pendingRef.current = saving; setPending(saving ? id : null); }} />
            </div>
          </details></li>;
        })}
      </ol>
    </main>
    <footer className={archive.footer}><span>MyTake</span><Link href="/about">About & Credits</Link></footer>
  </div>;
}
