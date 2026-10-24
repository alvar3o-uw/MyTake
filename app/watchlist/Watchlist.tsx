"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { WatchlistEntry } from "@/lib/watchlist/records";
import { posterUrl } from "@/lib/tmdb/media";
import CollectionHeader from "../components/CollectionHeader";
import AddMediaDialog from "../components/AddMediaDialog";
import WatchlistEntryMenu from "../components/WatchlistEntryMenu";
import UiIcon from "../components/UiIcon";
import styles from "../library/page.module.css";
export default function Watchlist({ username, initialEntries }: {
    username: string;
    initialEntries: WatchlistEntry[];
}) {
    const [entries, setEntries] = useState(initialEntries);
    const [filter, setFilter] = useState<"all" | "movie" | "tv">("all");
    const [order, setOrder] = useState<"az" | "za">("az");
    const heading = useRef<HTMLHeadingElement>(null);
    const visible = entries.filter(entry => filter === "all" || entry.mediaType === filter).sort((a, b) => order === "az" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
    function removed(id: string) { setEntries(previous => previous.filter(entry => entry.id !== id)); heading.current?.focus(); }
    return <div className={styles.archive}>
  <CollectionHeader username={username} active="watchlist"/>
  <main className={styles.main}><section className={styles.library} aria-labelledby="watchlist-title">
   <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>STORIES FOR ANOTHER DAY</p><h1 id="watchlist-title" ref={heading} tabIndex={-1}>Watchlist<span aria-live="polite">{visible.length} {visible.length === 1 ? "Title" : "Titles"}</span></h1></div><AddMediaDialog destination="watchlist" onAdd={entry => setEntries(previous => [entry, ...previous.filter(item => item.id !== entry.id)])}/></div>
   <div className={styles.toolbar}><div className={styles.filters} role="group" aria-label="Media type">
    {([{ value: "all", label: "All Media" }, { value: "movie", label: "Movies" }, { value: "tv", label: "TV Shows" }] as const).map(item => <button key={item.value} type="button" className={filter === item.value ? styles.selected : undefined} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}><UiIcon name={item.value === "all" ? "allMedia" : item.value} className={styles.icon}/>{item.label}</button>)}
   </div><div className={styles.sortControl}>
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 4v16 M4 16l4 4 4-4 M14 5h7 M14 10h5 M16 15h3" /></svg>
    <select className={styles.sort} aria-label="Sort watchlist" value={order} onChange={event => setOrder(event.target.value as "az" | "za")}>
     <option value="az">Alphabetical (A–Z)</option>
     <option value="za">Alphabetical (Z–A)</option>
    </select>
    <svg className={styles.sortChevron} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
   </div></div>
   {visible.length === 0 && <div className={styles.emptyLibrary}><UiIcon name="bookmark"/><h2>{entries.length === 0 ? "Your next watch starts here." : filter === "movie" ? "No movies here yet." : "No TV shows here yet."}</h2><p>{entries.length === 0 ? "Save the movies and shows you want to watch." : "Choose All Media to see your other titles, or add a new one."}</p></div>}
   <div className={styles.grid}>{visible.map(entry => <article key={entry.id} className={styles.entry}>
    <WatchlistEntryMenu entry={entry} onRemoved={removed}/>
    <div className={`${styles.cover} ${styles.placeholder}`}>{entry.posterPath ? <Image src={posterUrl(entry.posterPath, "w500")} alt="" fill sizes="(max-width:560px) 45vw,25vw" unoptimized style={{ objectFit: "cover" }}/> : <><span className={styles.coverKicker}>MYTAKE</span><span className={styles.placeholderTitle}>{entry.title}</span></>}</div>
    <div className={styles.entryHeading}><h3>{entry.title}</h3></div><p className={styles.meta}>{entry.year}{entry.year && <span> · </span>}{entry.type.toUpperCase()}</p>
   </article>)}</div>
  </section></main>
  <footer className={styles.footer}><span>MyTake</span><Link href="/about">About & Credits</Link></footer>
 </div>;
}
