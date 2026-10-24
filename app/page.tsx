import UiIcon from "./components/UiIcon";
import Link from "next/link";
import styles from "./page.module.css";
import Image from "next/image";
import addMediaStyles from "./components/AddMediaDialog.module.css";

const demoEntries = [
  { title: "Arrival", poster: "arrival", year: "2016", type: "MOVIE", rating: "9.3", status: "Completed", completed: true },
  { title: "Severance", poster: "severance", year: "2022", type: "TV SHOW", rating: "9.1", status: "In Progress · Through S1 E07", completed: false },
  { title: "The Bear", poster: "bear", year: "2022", type: "TV SHOW", rating: "8.8", status: "In Progress · Through S2 E06", completed: false },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>mytake<span>!</span></div>

      </header>
      <main>
        <section className={styles.hero} aria-labelledby="intro-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>FOR THE LOVE OF HAVING AN OPINION</p>
            <h1 id="intro-title">Your media.<br />Your taste.<br /><span>Your take.</span></h1>
            <p className={styles.description}>A personal home for everything you watch—and exactly what you think of it. Movies and TV shows, down to the decimal.</p>
            <div className={styles.heroActions}>
              <Link href="/sign-up" className={styles.primary}>Sign Up</Link>
              <Link href="/sign-in" className={styles.secondary}>Sign In</Link>
            </div>
            <div className={styles.mediaTypes}><span><UiIcon name="movie" />Movies</span><span><UiIcon name="tv" />TV Shows</span></div>
          </div>
          <div className={styles.previewArea}>
            <span className={styles.annotation}>a little shelf. a lot of opinions. <span aria-hidden="true">↴</span></span>
            <section className={styles.preview} aria-label="Sample library preview">
              <div className={styles.previewHeader}>
                <span className={styles.previewLibrary}>My Library <small>3 Titles</small></span>
                <button type="button" disabled className={`${addMediaStyles.trigger} ${styles.previewAdd}`}><svg className={addMediaStyles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14 M5 12h14" /></svg>Add Media</button>
              </div>
              <div className={styles.previewToolbar}>
                <div className={styles.previewFilters}><span><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z" /></svg>All Media</span><span><UiIcon name="movie" />Movies</span><span><UiIcon name="tv" />TV Shows</span></div>
              </div>
              <div className={styles.previewGrid}>
                {demoEntries.map((entry) => <article className={styles.previewCard} key={entry.poster}>
                  <div className={styles.demoPoster}>
                    <Image src={`/demo-posters/${entry.poster}.jpg`} alt="" fill sizes="(max-width: 740px) 27vw, 15vw" />
                  </div>
                  <div className={styles.demoEntryHeading}><h3>{entry.title}</h3><strong>{entry.rating}<small>/10</small></strong></div>
                  <p className={styles.demoMeta}>{entry.year} · {entry.type}</p>
                  <p className={`${styles.demoStatus} ${entry.completed ? "" : styles.demoInProgress}`}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={entry.completed ? "M20 11v1a8 8 0 1 1-4.7-7.3 M8 11l4 4 9-10" : "M8 5l11 7-11 7z"} /></svg>{entry.status}</p>
                </article>)}
              </div>
            </section>
            <span className={styles.sticker}>Yes, the .3 matters.</span>
          </div>
        </section>
        <section className={styles.features} aria-label="What makes MyTake personal">
          <article><span className={styles.featureIcon} aria-hidden="true">9.3</span><h2>More than five stars.</h2><p>An 8.8 isn’t a 9. Give your opinion the room it deserves, with ratings in steps of 0.1.</p></article>
          <article><span className={styles.featureIcon}><UiIcon name="play" /></span><h2>Still watching? Still rate.</h2><p>Your opinion doesn’t wait for the finale. Rate a show as you go, and keep track of the last episode you watched.</p></article>
          <article><span className={styles.featureIcon}><UiIcon name="books" className={styles.booksIcon} /></span><h2>A collection that’s you.</h2><p>Keep movies and TV shows together. The favourites, the disappointments, the in-between.</p></article>
        </section>
      </main>
      <footer className={styles.footer}><span className={styles.logo}>mytake<span>!</span></span><p>A personal home for your opinions.</p><Link href="/about" className={styles.creditsLink}>About & Credits</Link></footer>
    </div>
  );
}
