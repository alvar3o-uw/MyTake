import UiIcon from "./components/UiIcon";
import Link from "next/link";
import styles from "./page.module.css";
import library from "./library/page.module.css";

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
            <p className={styles.description}>A personal home for everything you watch—and exactly what you think of it. Movies, TV shows, and anime, down to the decimal.</p>
            <div className={styles.heroActions}>
              <Link href="/sign-up" className={styles.primary}>Sign Up</Link>
              <Link href="/sign-in" className={styles.secondary}>Sign In</Link>
            </div>
            <div className={styles.mediaTypes}><span><UiIcon name="movie" />Movies</span><span><UiIcon name="tv" />TV Shows</span><span><UiIcon name="anime" />Anime</span></div>
          </div>
          <div className={styles.previewArea}>
            <span className={styles.annotation}>a little shelf. a lot of opinions. <span aria-hidden="true">↴</span></span>
            <section className={styles.preview} aria-label="Sample library preview">
              <div className={styles.previewHeader}><span className={styles.previewLibrary}><UiIcon name="books" className={styles.booksIcon} />My Library</span><small>3 Titles</small><span className={styles.previewDots} aria-hidden="true">•••</span></div>
              <div className={styles.previewFilters}><span>All Media</span><span>Movies</span><span>TV Shows</span><span>Anime</span></div>
              <div className={styles.previewGrid}>
                <article>
                  <div className={`${library.cover} ${library.arrival} ${styles.poster}`}><div className={library.orbit} /><span className={styles.posterTitle}>ARRIVAL</span></div>
                  <h3>Arrival</h3><p>Movie <strong>9.3<small>/10</small></strong></p>
                </article>
                <article>
                  <div className={`${library.cover} ${library.bear} ${styles.poster}`}><span className={styles.bearTitle}>THE<br />BEAR</span></div>
                  <h3>The Bear</h3><p>TV Show <strong>8.8<small>/10</small></strong></p>
                </article>
                <article>
                  <div className={`${library.cover} ${library.spirited} ${styles.poster}`}><div className={styles.sun} /><span className={styles.spiritedTitle}>SPIRITED<br />AWAY</span></div>
                  <h3>Spirited Away</h3><p>Anime <strong>9.6<small>/10</small></strong></p>
                </article>
              </div>
              <div className={styles.progress}><UiIcon name="play" className={styles.play} /><div><strong>The Bear</strong><span>Watching · Through S2 E06</span></div><span className={styles.progressScore}>8.8<small>/10</small></span></div>
            </section>
            <span className={styles.sticker}>Yes, the .3 matters.</span>
          </div>
        </section>
        <section className={styles.features} aria-label="What makes MyTake personal">
          <article><span className={styles.featureIcon} aria-hidden="true">9.3</span><h2>More than five stars.</h2><p>An 8.8 isn’t a 9. Give your opinion the room it deserves, with ratings in steps of 0.1.</p></article>
          <article><span className={styles.featureIcon}><UiIcon name="play" /></span><h2>Still watching? Still rate.</h2><p>Your opinion doesn’t wait for the finale. Rate episodes, seasons, story arcs, or the whole series as you go.</p></article>
          <article><span className={styles.featureIcon}><UiIcon name="books" className={styles.booksIcon} /></span><h2>A collection that’s you.</h2><p>Keep movies, TV shows, and anime together. The favourites, the disappointments, the in-between.</p></article>
        </section>
      </main>
      <footer className={styles.footer}><span className={styles.logo}>mytake<span>!</span></span><p>A personal home for your opinions.</p></footer>
    </div>
  );
}
