"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LibraryEntry } from "../types";
import { posterUrl } from "@/lib/tmdb/media";
import { titleStats, genreStats, type ProfileStats, type RankedSeason, type RankedEpisode } from "@/lib/profiles/stats";
import { profileTitles, type ProfileFilter } from "@/lib/profiles/titles";
import CollectionHeader from "../components/CollectionHeader";
import LibraryEntryMenu from "../components/LibraryEntryMenu";
import UiIcon from "../components/UiIcon";
import archive from "../library/page.module.css";
import styles from "./page.module.css";

export default function Profile({ username, initialEntries, stats }: { username: string; initialEntries: LibraryEntry[]; stats: ProfileStats }) {
  const [entries, setEntries] = useState(initialEntries);
  const [filter, setFilter] = useState<ProfileFilter>("all");
  const heading = useRef<HTMLHeadingElement>(null);
  const totals = titleStats(entries);
  const genres = genreStats(entries, stats.genreNames);
  const maxBucket = Math.max(1, ...totals.distribution);
  const existing = new Set(entries.map(entry => entry.id));
  const topSeasons = stats.topSeasons.filter(row => existing.has(row.entryId));
  const topEpisodes = stats.topEpisodes.filter(row => existing.has(row.entryId));
  const { favourites, highestRated } = profileTitles(entries, filter);
  function updated(entry: LibraryEntry) { setEntries(previous => previous.map(item => item.id === entry.id ? entry : item)); }
  function removed(id: string) { setEntries(previous => previous.filter(entry => entry.id !== id)); heading.current?.focus(); }
  function cards(items: LibraryEntry[]) {
    return <div className={styles.titleShelf}>{items.map(entry => <article key={entry.id} className={styles.titleCard}>
      <LibraryEntryMenu compact entry={entry} onUpdated={updated} onRemoved={removed} />
      <div className={styles.poster}>{entry.posterPath ? <Image src={posterUrl(entry.posterPath, "w500")} alt="" fill sizes="110px" unoptimized style={{ objectFit: "cover" }} /> : <span>{entry.title}</span>}</div>
      <h3><Link className={archive.entryLink} href={`/media/${entry.mediaType}/${entry.tmdbId}`}>{entry.title}</Link></h3>
      <p className={styles.cardMeta}>{entry.year}{entry.year && " · "}{entry.type}</p>
      <span className={styles.cardRating}>{entry.rating === null ? "Unrated" : <>{entry.rating}<small>/10</small></>}</span>
    </article>)}</div>;
  }
  function rankings(rows: (RankedSeason | RankedEpisode)[], episodeList: boolean) {
    return rows.length ? <ol className={styles.ranking}>{rows.map((row, index) => <li key={`${row.entryId}-${row.season}-${"episodeId" in row ? row.episodeId : "season"}`}><Link href={`/media/tv/${row.showId}/episodes?season=${row.season}${"episodeId" in row ? `&episode=${row.episodeId}#episode-${row.episodeId}` : "#season-rating"}`}>
      <span className={styles.rank}>{index + 1}</span>
      {row.imagePath && <Image src={`https://image.tmdb.org/t/p/${episodeList ? "w300" : "w92"}${row.imagePath}`} width={episodeList ? 64 : 34} height={episodeList ? 36 : 51} className={episodeList ? styles.episodeImage : styles.seasonImage} alt="" unoptimized />}
      <div className={styles.rankTitle}><h3>{row.name}</h3><p>{row.showTitle}</p><small>{row.season === 0 ? "Specials" : `S${row.season}`}{"episode" in row ? ` · E${String(row.episode).padStart(2, "0")}` : ""}</small></div>
      <strong>{row.rating}<small>/10</small></strong>
    </Link></li>)}</ol> : <p className={styles.smallEmpty}>Rate {episodeList ? "episodes" : "seasons"} to see your top picks here.</p>;
  }

  return <div className={archive.archive}>
    <CollectionHeader username={username} active="profile" />
    <main className={styles.main}>
      <div className={styles.identity}><div className={styles.avatar} aria-hidden="true">{username.charAt(0).toUpperCase()}</div><div><p>MY PROFILE</p><h1 ref={heading} tabIndex={-1}>@{username}</h1></div><Link className={styles.settings} href="/settings"><UiIcon name="settings" />Settings</Link></div>
      <section className={styles.statsArea} aria-label="Stats across your whole library">
        <div className={styles.counters}>{[{ label: "Movies Rated", value: totals.moviesRated }, { label: "Shows Rated", value: totals.showsRated }, { label: "Episodes Rated", value: stats.episodesRated }, { label: "Reviews Written", value: stats.reviewsWritten }, { label: "Shows Completed", value: totals.showsCompleted }, { label: "Shows In Progress", value: totals.showsInProgress }, { label: "Seasons Rated", value: stats.seasonsRated }, { label: "Average Rating", value: totals.averageRating === null ? "—" : totals.averageRating.toFixed(2) }].map(item => <div className={styles.counter} key={item.label}><strong>{item.value}{item.label === "Average Rating" && totals.averageRating !== null && <small>/10</small>}</strong><span>{item.label}</span></div>)}</div>
        <figure className={styles.distribution}><figcaption>Rating Distribution</figcaption><p>Movie &amp; show scores · Across your library</p><div className={styles.chart} role="group" aria-label="Distribution of overall movie and show ratings">{totals.distribution.map((count, bucket) => <div className={styles.bucket} key={bucket} tabIndex={0} role="img" aria-label={`${bucket === 10 ? "10" : `${bucket}–${bucket}.9`}: ${count} ${count === 1 ? "title" : "titles"}`}><small aria-hidden="true">{count}</small><div className={styles.barTrack}><span style={{ height: `${count / maxBucket * 100}%` }} /></div><span>{bucket}</span></div>)}</div></figure>
      </section>
      <section className={styles.insights} aria-label="Taste insights across your whole library">
        <div className={styles.insightPanel}><h2>Most-Rated Genres</h2>
          {genres.mostRated.length ? <ol className={styles.insightList}>{genres.mostRated.map(genre => <li key={genre.name}><span>{genre.name}</span><strong>{genre.count}<small> {genre.count === 1 ? "title" : "titles"}</small></strong></li>)}</ol> : <p className={styles.smallEmpty}>{genres.ratedTitles ? "Genre data is unavailable right now." : "Rate titles to discover your genre patterns."}</p>}
          <p className={styles.insightNote}>Genre data for {genres.coveredTitles} of {genres.ratedTitles} rated titles. A title can count toward multiple genres.</p>
        </div>
        <div className={styles.insightPanel}><h2>Highest-Rated Genres</h2>
          {genres.highestRated.length ? <ol className={styles.insightList}>{genres.highestRated.map(genre => <li key={genre.name}><div><span>{genre.name}</span><small>{genre.count} {genre.count === 1 ? "title" : "titles"}</small></div><strong>{genre.average.toFixed(2)}<small>/10</small></strong></li>)}</ol> : <p className={styles.smallEmpty}>Genre averages appear when rated titles have genre data.</p>}
          <p className={styles.insightNote}>Average overall title score. Episode and season scores stay separate.</p>
        </div>

      </section>
      <div className={styles.toolbar}><div className={archive.filters} role="group" aria-label="Profile media type">{([{ value: "all", label: "All Media" }, { value: "movie", label: "Movies" }, { value: "tv", label: "TV Shows" }] as const).map(item => <button key={item.value} type="button" className={filter === item.value ? archive.selected : undefined} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}><UiIcon name={item.value === "all" ? "allMedia" : item.value} />{item.label}</button>)}</div></div>
      <div className={styles.collections}>
      <section className={styles.section} aria-labelledby="favourite-titles"><div className={styles.sectionHeading}><h2 id="favourite-titles"><UiIcon name="star" />Favourites</h2><span>{favourites.length} {favourites.length === 1 ? "Title" : "Titles"}</span></div><p className={styles.description}>The stories you choose to keep close.</p>
        {favourites.length ? cards(favourites) : <div className={styles.empty}><p>{entries.some(entry => entry.isFavourite) ? "No favourites in this category yet." : "Choose Add to Favourites from a title’s three-dot menu in your library."}</p><Link href="/library">My Library <span aria-hidden="true">→</span></Link></div>}
      </section>
      <section className={styles.section} aria-labelledby="highest-rated"><div className={styles.sectionHeading}><h2 id="highest-rated">Highest Rated</h2><span>Top {highestRated.length || 4}</span></div><p className={styles.description}>Your highest scores, drawn from your library.</p>
        {highestRated.length ? cards(highestRated) : <div className={styles.empty}><p>Rate a movie or show to see your highest-rated titles here.</p><Link href="/library">My Library <span aria-hidden="true">→</span></Link></div>}
      </section>
      </div>
      {filter !== "movie" && <div className={styles.collections}>
        <section className={styles.section} aria-labelledby="profile-top-seasons"><div className={styles.sectionHeading}><h2 id="profile-top-seasons">Top Seasons</h2><span>Top 5</span></div>{rankings(topSeasons, false)}</section>
        <section className={styles.section} aria-labelledby="profile-top-episodes"><div className={styles.sectionHeading}><h2 id="profile-top-episodes">Top Episodes</h2><span>Top 5</span></div>{rankings(topEpisodes, true)}</section>
      </div>}
    </main>
    <footer className={archive.footer}><span>MyTake</span><Link href="/about">About & Credits</Link></footer>
  </div>;
}
