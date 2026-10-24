"use client";

import Link from "next/link";
import { progressLabel } from "@/lib/tmdb/episodes";
import Image from "next/image";
import { posterUrl } from "@/lib/tmdb/media";
import ProfileNotice from "../components/ProfileNotice";
import UiIcon from "../components/UiIcon";
import { useRef, useState } from "react";
import { sortLibrary, type LibraryOrder } from "@/lib/sort-library";
import LibraryEntryMenu from "../components/LibraryEntryMenu";
import AccountMenu from "../components/AccountMenu";
import AddMediaDialog from "../components/AddMediaDialog";
import type { LibraryEntry } from "../types";
import styles from "./page.module.css";

function Icon({ path }: { path: string }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={path} />
    </svg>
  );
}

export default function Library({ username, initialEntries, profileUpdated = false }: { username: string; initialEntries: LibraryEntry[]; profileUpdated?: boolean }) {
  const [entries, setEntries] = useState<LibraryEntry[]>(initialEntries);
  const [order, setOrder] = useState<LibraryOrder>("descending");
  const [mediaFilter, setMediaFilter] = useState<"all" | "movie" | "tv">("all");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const filteredEntries = entries.filter((entry) => mediaFilter === "all" || entry.mediaType === mediaFilter);
  const sortedEntries = sortLibrary(filteredEntries, order);

  function addEntry(entry: LibraryEntry) {
    setEntries((previousEntries) => [entry, ...previousEntries.filter((previous) => previous.id !== entry.id)]);
  }

  function removeEntry(entryId: string) {
    setEntries((previous) => previous.filter((entry) => entry.id !== entryId));
    headingRef.current?.focus();
  }

  return (
    <div className={styles.archive}>
      <header className={styles.header}>
        <div className={styles.wordmark}>mytake<span>!</span></div>
        <nav aria-label="Main navigation" className={styles.navigation}>
          <button type="button" disabled className={styles.active} aria-current="page"><UiIcon name="books" className={styles.icon} />Library</button><button type="button" disabled><Icon path="M6 3h12v18l-6-4-6 4z" />Watchlist</button>
        </nav>
        <AccountMenu username={username} />
      </header>

      <main className={styles.main}>
        {profileUpdated && <ProfileNotice username={username} />}
        <section className={styles.library} aria-labelledby="library-title">
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>YOUR SPACE FOR STORIES</p><h1 ref={headingRef} tabIndex={-1} id="library-title">My Library<span aria-live="polite">{filteredEntries.length} {filteredEntries.length === 1 ? "Title" : "Titles"}</span></h1></div>
            <AddMediaDialog onAdd={addEntry} />
          </div>
          <div className={styles.toolbar}>
            <div className={styles.filters} role="group" aria-label="Media type">
              <button type="button" className={mediaFilter === "all" ? styles.selected : undefined} aria-pressed={mediaFilter === "all"} onClick={() => setMediaFilter("all")}><Icon path="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z" />All Media</button>
              <button type="button" className={mediaFilter === "movie" ? styles.selected : undefined} aria-pressed={mediaFilter === "movie"} onClick={() => setMediaFilter("movie")}><UiIcon name="movie" className={styles.icon} />Movies</button>
              <button type="button" className={mediaFilter === "tv" ? styles.selected : undefined} aria-pressed={mediaFilter === "tv"} onClick={() => setMediaFilter("tv")}><UiIcon name="tv" className={styles.icon} />TV Shows</button>
            </div>
            <div className={styles.sortControl}>
              <Icon path="M8 4v16 M4 16l4 4 4-4 M14 5h7 M14 10h5 M16 15h3" />
              <select className={styles.sort} aria-label="Sort library" value={order} onChange={(event) => setOrder(event.target.value as LibraryOrder)}>
                <option value="descending">Descending Order</option>
                <option value="ascending">Ascending Order</option>
                <option value="alphabetical">Alphabetical (A–Z)</option>
              </select>
              <svg className={styles.sortChevron} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>
          {filteredEntries.length === 0 && <div className={styles.emptyLibrary}>
            <UiIcon name="books" />
            <h2>{entries.length === 0 ? "Your next take starts here." : mediaFilter === "movie" ? "No movies here yet." : "No TV shows here yet."}</h2>
            <p>{entries.length === 0 ? "Add a movie or show to start your library." : "Choose All Media to see your other titles, or add a new one."}</p>
          </div>}
          <div className={styles.grid}>
            {sortedEntries.map((entry) => (
              <article className={styles.entry} key={entry.id}>
                <LibraryEntryMenu entry={entry} onRemoved={removeEntry} onUpdated={(updated) => setEntries((previous) => previous.map((item) => item.id === updated.id ? updated : item))} />
                <div className={`${styles.cover} ${styles.placeholder}`}>
                  {entry.posterPath && <Image src={posterUrl(entry.posterPath, "w500")} alt="" fill sizes="(max-width: 560px) 45vw, 25vw" unoptimized style={{ objectFit: "cover" }} />}
                  {!entry.posterPath && <><span className={styles.coverKicker}>MYTAKE</span><span className={styles.placeholderTitle}>{entry.title}</span></>}
                </div>
                <div className={styles.entryHeading}>
                  <h3>{entry.title}</h3>
                  <span className={entry.rating === null ? styles.unrated : styles.rating}>
                    {entry.rating === null ? <><Icon path="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" /><span>Unrated</span></> : <>{entry.rating}<small>/10</small></>}
                  </span>
                </div>
                {(entry.year || entry.type) && <p className={styles.meta}>{entry.year}{entry.year && entry.type && <span> · </span>}{entry.type?.toUpperCase()}</p>}
                {entry.status && <span className={`${styles.status} ${entry.status === "In Progress" ? styles.watching : ""}`}>
                  <Icon path={entry.status === "Completed" ? "M20 11v1a8 8 0 1 1-4.7-7.3 M8 11l4 4 9-10" : "M8 5l11 7-11 7z"} />{progressLabel(entry.status, entry.progress)}
                </span>}
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className={styles.footer}><span>MyTake </span><Link href="/about">About & Credits</Link></footer>
    </div>
  );
}
