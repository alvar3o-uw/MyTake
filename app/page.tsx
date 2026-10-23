import styles from "./page.module.css";

function Icon({ path }: { path: string }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={path} />
    </svg>
  );
}

export default function Home() {
  return (
    <div className={styles.archive}>
      <header className={styles.header}>
        <div className={styles.wordmark}>mytake<span>!</span></div>
        <nav aria-label="Main navigation" className={styles.navigation}>
          <button type="button" disabled className={styles.active} aria-current="page"><Icon path="M4 4h5v16H4z M12 4h4v16h-4z M18 5l3 14" />Library</button><button type="button" disabled><Icon path="M6 3h12v18l-6-4-6 4z" />Watchlist</button>
        </nav>
        <button type="button" disabled className={styles.avatar} aria-label="Your profile">A</button>
      </header>

      <main className={styles.main}>
        <section className={styles.library} aria-labelledby="library-title">
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}><span className={styles.sparkle} aria-hidden="true">✳</span> YOUR SPACE FOR STORIES</p><h1 id="library-title">My Library<span>4 titles</span></h1></div>
            <button type="button" disabled className={styles.addButton}><Icon path="M12 5v14 M5 12h14" />Add Media</button>
          </div>
          <div className={styles.toolbar}>
            <div className={styles.filters} role="group" aria-label="Media type">
              <button type="button" disabled className={styles.selected} aria-pressed="true"><Icon path="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z" />All Media</button>
              <button type="button" disabled aria-pressed="false"><Icon path="M4 3h16v18H4z M4 8h16 M4 16h16 M8 3v5 M16 3v5 M8 16v5 M16 16v5" />Movies</button>
              <button type="button" disabled aria-pressed="false"><Icon path="M3 7h18v14H3z M8 3l4 4 4-4 M7 17h6" />TV Shows</button>
              <button type="button" disabled aria-pressed="false"><Icon path="M12 2l2.8 6.8L22 12l-7.2 3.2L12 22l-2.8-6.8L2 12l7.2-3.2z" />Anime</button>
            </div>
            <button type="button" disabled className={styles.sort}><Icon path="M8 4v16 M4 16l4 4 4-4 M14 5h7 M14 10h5 M16 15h3" />Recently Added</button>
          </div>
          <div className={styles.grid}>
            <article className={styles.entry}>
              <div className={`${styles.cover} ${styles.arrival}`}><span className={styles.coverKicker}>A FILM BY DENIS VILLENEUVE</span><div className={styles.orbit} /><span className={styles.coverTitle}>ARRIVAL</span><span className={styles.coverFoot}>WHY ARE THEY HERE?</span></div>
              <div className={styles.entryHeading}><h3>Arrival</h3><span className={styles.rating}>9.3<small>/10</small></span></div><p className={styles.meta}>2016 <span>·</span> MOVIE</p><span className={styles.status}><Icon path="M20 11v1a8 8 0 1 1-4.7-7.3 M8 11l4 4 9-10" />Completed</span>
            </article>
            <article className={styles.entry}>
              <div className={`${styles.cover} ${styles.bear}`}><span className={styles.coverKicker}>EVERY SECOND COUNTS.</span><span className={styles.bearGraphic}>86</span><span className={styles.coverTitle}>THE<br />BEAR</span><span className={styles.coverFoot}>YES, CHEF.</span></div>
              <div className={styles.entryHeading}><h3>The Bear</h3><span className={styles.rating}>8.8<small>/10</small></span></div><p className={styles.meta}>2022 <span>·</span> TV SHOW</p><span className={`${styles.status} ${styles.watching}`}><Icon path="M8 5l11 7-11 7z" />Watching · Through S2 E06</span>
            </article>
            <article className={styles.entry}>
              <div className={`${styles.cover} ${styles.spirited}`}><span className={styles.coverKicker}>A HAYAO MIYAZAKI FILM</span><div className={styles.sun} /><span className={styles.japanese} lang="ja">千と千尋</span><span className={styles.coverTitle}>SPIRITED<br />AWAY</span><span className={styles.coverFoot}>A WORLD BEYOND YOUR IMAGINATION</span></div>
              <div className={styles.entryHeading}><h3>Spirited Away</h3><span className={styles.rating}>9.6<small>/10</small></span></div><p className={styles.meta}>2001 <span>·</span> ANIME FILM</p><span className={styles.status}><Icon path="M20 11v1a8 8 0 1 1-4.7-7.3 M8 11l4 4 9-10" />Completed</span>
            </article>
            <article className={styles.entry}>
              <div className={`${styles.cover} ${styles.severance}`}><span className={styles.coverKicker}>WELCOME TO LUMON.</span><div className={styles.corridor} /><span className={styles.coverTitle}>severance</span><span className={styles.coverFoot}>A WORK / LIFE BALANCE.</span></div>
              <div className={styles.entryHeading}><h3>Severance</h3><span className={styles.rating}>9.1<small>/10</small></span></div><p className={styles.meta}>2022 <span>·</span> TV SHOW</p><span className={`${styles.status} ${styles.watching}`}><Icon path="M8 5l11 7-11 7z" />Watching · Through S1 E07</span>
            </article>
          </div>
        </section>
      </main>
      <footer className={styles.footer}><span>MyTake <span className={styles.footerSymbol} aria-hidden="true">✳</span></span><p>Sample library · Static preview</p></footer>
    </div>
  );
}
