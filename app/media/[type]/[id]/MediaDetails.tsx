"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EpisodeHighlight } from "@/lib/episodes/highlights";
import type { LibraryEntry } from "@/app/types";
import { posterUrl } from "@/lib/tmdb/media";
import { progressLabel } from "@/lib/tmdb/episodes";
import ReviewEditor from "@/app/components/ReviewEditor";
import { saveMediaReview } from "@/app/reviews/actions";
import CollectionHeader from "@/app/components/CollectionHeader";
import EditEntryDialog from "@/app/components/EditEntryDialog";
import UiIcon from "@/app/components/UiIcon";
import archive from "@/app/library/page.module.css";
import styles from "./page.module.css";

export default function MediaDetails({ username, initialEntry, overview, genres, runtime, catalogueUnavailable, backHref, topEpisodes, favouriteEpisode, highlightsUnavailable, initialReview }: {
  username: string; initialEntry: LibraryEntry; overview: string; genres: string[];
  initialReview: string | null; topEpisodes: EpisodeHighlight[]; favouriteEpisode: EpisodeHighlight | null; highlightsUnavailable: boolean;
  runtime: number | null; catalogueUnavailable: boolean; backHref: string;
}) {
  const [entry, setEntry] = useState(initialEntry);
  const [editing, setEditing] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  return <div className={archive.archive}>
    <CollectionHeader username={username} active="library" />
    <main className={styles.main}>
      <Link href={backHref} className={styles.back}>← My Library</Link>
      <article className={styles.details} aria-labelledby="media-title">
        <aside className={styles.sidebar}>
        <div className={styles.poster}>
          {entry.posterPath ? <Image src={posterUrl(entry.posterPath, "w500")} alt={`${entry.title} poster`} fill sizes="(max-width: 600px) 55vw, 300px" unoptimized loading="eager" style={{ objectFit: "cover" }} /> : <span>{entry.title}</span>}
        </div>
        {entry.mediaType === "tv" && <div className={styles.highlights}>
          {highlightsUnavailable ? <p role="status">Couldn’t load your episode picks. <button type="button" onClick={() => router.refresh()}>Try Again</button></p> : <>
            <section aria-labelledby="favourite-episode"><h2 id="favourite-episode"><span aria-hidden="true">★</span> Your Favourite Episode</h2>
              {favouriteEpisode ? <Highlight episode={favouriteEpisode} /> : <p>Star an episode to choose your favourite.</p>}
            </section>
            <section aria-labelledby="top-episodes"><h2 id="top-episodes">Your Top 3 Episodes</h2>
              {topEpisodes.length ? <ol>{topEpisodes.map(episode => <li key={episode.episodeId}><Highlight episode={episode} /></li>)}</ol> : <p>Rate episodes to see your top picks here.</p>}
            </section>
          </>}
        </div>}
        </aside>
        <div className={styles.content}>
          <p className={styles.meta}>{[entry.type, entry.year, runtime ? `${runtime} min` : null].filter(Boolean).join(" · ")}</p>
          <h1 id="media-title">{entry.title}</h1>
          {genres.length > 0 && <ul className={styles.genres} aria-label="Genres">{genres.map((genre, index) => <li key={`${genre}-${index}`}>{genre}</li>)}</ul>}
          <section className={styles.take} aria-labelledby="your-take">
            <div className={styles.takeHeading}><h2 id="your-take">Your Take</h2><button ref={editButton} type="button" onClick={() => setEditing(true)} aria-haspopup="dialog"><UiIcon name="edit" />Edit Entry</button></div>
            <div className={styles.score}>{entry.rating === null ? <span className={styles.unrated}>Unrated</span> : <><strong>{entry.rating}</strong><span>/10</span></>}</div>
            <p className={styles.status}>{progressLabel(entry.status, entry.progress)}</p>
            {entry.progress && <p className={styles.episode}>{entry.progress.episodeName}</p>}
          </section>
          {entry.mediaType === "tv" && <Link className={styles.episodesLink} href={`/media/tv/${entry.tmdbId}/episodes${backHref.includes("?") ? backHref.slice(backHref.indexOf("?")) : ""}`}>Episodes <span aria-hidden="true">→</span></Link>}
          <section className={styles.writtenReview} aria-labelledby="written-review"><h2 id="written-review">Your Review</h2><ReviewEditor initialReview={initialReview} label={`Your review of ${entry.title}`} onSave={draft => saveMediaReview(entry.id, draft)} /></section>
          <section className={styles.synopsis} aria-labelledby="synopsis"><h2 id="synopsis">Synopsis</h2>
            {catalogueUnavailable ? <div role="status"><p>Couldn’t load the synopsis right now. Your saved take is still here.</p><button type="button" onClick={() => router.refresh()}>Try Again</button></div> : <p>{overview || "No synopsis available for this title."}</p>}
          </section>
        </div>
      </article>
    </main>
    <footer className={archive.footer}><span>MyTake</span><Link href="/about">About & Credits</Link></footer>
    {editing && <EditEntryDialog entry={entry} onSaved={setEntry} onClose={() => { setEditing(false); editButton.current?.focus(); }} />}
  </div>;
}

function Highlight({ episode }: { episode: EpisodeHighlight }) {
  return <div className={styles.highlight}>
    {episode.stillPath && <Image src={`https://image.tmdb.org/t/p/w300${episode.stillPath}`} alt="" width={64} height={36} unoptimized />}
    <div><small>{episode.seasonNumber === 0 ? "Specials" : `S${episode.seasonNumber}`} · E{String(episode.episodeNumber).padStart(2, "0")}</small><h3>{episode.title}</h3></div>
    {episode.rating !== null && <strong>{episode.rating}<small>/10</small></strong>}
  </div>;
}
