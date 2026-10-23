"use client";

import ProfileNotice from "../components/ProfileNotice";
import UiIcon from "../components/UiIcon";
import { useState } from "react";
import { sortLibrary, type LibraryOrder } from "@/lib/sort-library";
import AccountMenu from "../components/AccountMenu";
import AddMediaDialog from "../components/AddMediaDialog";
import type { LibraryEntry, NewEntry } from "../types";
import styles from "./page.module.css";

function Icon({ path }: { path: string }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={path} />
    </svg>
  );
}

const initialEntries: LibraryEntry[] = [
  { id: "sample-arrival", title: "Arrival", rating: 9.3, cover: "arrival", year: "2016", type: "Movie", status: "Completed" },
  { id: "sample-bear", title: "The Bear", rating: 8.8, cover: "bear", year: "2022", type: "TV Show", status: "Watching · Through S2 E06" },
  { id: "sample-spirited", title: "Spirited Away", rating: 9.6, cover: "spirited", year: "2001", type: "Anime Film", status: "Completed" },
  { id: "sample-severance", title: "Severance", rating: 9.1, cover: "severance", year: "2022", type: "TV Show", status: "Watching · Through S1 E07" },
];

export default function Library({ username, profileUpdated = false }: { username: string; profileUpdated?: boolean }) {
  const [entries, setEntries] = useState<LibraryEntry[]>(initialEntries);
  const [order, setOrder] = useState<LibraryOrder>("descending");
  const sortedEntries = sortLibrary(entries, order);

  function addEntry(entry: NewEntry) {
    const newEntry: LibraryEntry = { ...entry, id: crypto.randomUUID() };
    setEntries((previousEntries) => [newEntry, ...previousEntries]);
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
            <div><p className={styles.eyebrow}>YOUR SPACE FOR STORIES</p><h1 id="library-title">My Library<span>{entries.length} Titles</span></h1></div>
            <AddMediaDialog onAdd={addEntry} />
          </div>
          <div className={styles.toolbar}>
            <div className={styles.filters} role="group" aria-label="Media type">
              <button type="button" disabled className={styles.selected} aria-pressed="true"><Icon path="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z" />All Media</button>
              <button type="button" disabled aria-pressed="false"><Icon path="M4 3h16v18H4z M4 8h16 M4 16h16 M8 3v5 M16 3v5 M8 16v5 M16 16v5" />Movies</button>
              <button type="button" disabled aria-pressed="false"><Icon path="M3 7h18v14H3z M8 3l4 4 4-4 M7 17h6" />TV Shows</button>
              <button type="button" disabled aria-pressed="false"><UiIcon name="anime" className={styles.icon} />Anime</button>
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
          <div className={styles.grid}>
            {sortedEntries.map((entry) => (
              <article className={styles.entry} key={entry.id}>
                <div className={`${styles.cover} ${entry.cover ? styles[entry.cover] : styles.placeholder}`}>
                  {entry.cover === "arrival" && <><span className={styles.coverKicker}>A FILM BY DENIS VILLENEUVE</span><div className={styles.orbit} /><span className={styles.coverTitle}>ARRIVAL</span><span className={styles.coverFoot}>WHY ARE THEY HERE?</span></>}
                  {entry.cover === "bear" && <><span className={styles.coverKicker}>EVERY SECOND COUNTS.</span><span className={styles.bearGraphic}>86</span><span className={styles.coverTitle}>THE<br />BEAR</span><span className={styles.coverFoot}>YES, CHEF.</span></>}
                  {entry.cover === "spirited" && <><span className={styles.coverKicker}>A HAYAO MIYAZAKI FILM</span><div className={styles.sun} /><span className={styles.japanese} lang="ja">千と千尋</span><span className={styles.coverTitle}>SPIRITED<br />AWAY</span><span className={styles.coverFoot}>A WORLD BEYOND YOUR IMAGINATION</span></>}
                  {entry.cover === "severance" && <><span className={styles.coverKicker}>WELCOME TO LUMON.</span><div className={styles.corridor} /><span className={styles.coverTitle}>severance</span><span className={styles.coverFoot}>A WORK / LIFE BALANCE.</span></>}
                  {!entry.cover && <><span className={styles.coverKicker}>MYTAKE</span><span className={styles.placeholderTitle}>{entry.title}</span><span className={styles.coverFoot}>PERSONAL ENTRY</span></>}
                </div>
                <div className={styles.entryHeading}>
                  <h3>{entry.title}</h3>
                  <span className={entry.rating === null ? styles.unrated : styles.rating}>
                    {entry.rating === null ? <><Icon path="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" /><span>Unrated</span></> : <>{entry.rating}<small>/10</small></>}
                  </span>
                </div>
                {entry.year && <p className={styles.meta}>{entry.year} <span>·</span> {entry.type?.toUpperCase()}</p>}
                {entry.status && <span className={`${styles.status} ${entry.status.startsWith("Watching") ? styles.watching : ""}`}>
                  <Icon path={entry.status === "Completed" ? "M20 11v1a8 8 0 1 1-4.7-7.3 M8 11l4 4 9-10" : "M8 5l11 7-11 7z"} />{entry.status}
                </span>}
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className={styles.footer}><span>MyTake </span></footer>
    </div>
  );
}
