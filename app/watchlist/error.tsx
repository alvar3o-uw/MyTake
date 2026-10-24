"use client";
import styles from "../components/AccountPage.module.css";
export default function WatchlistError({ retry }: {
    retry: () => void;
}) {
    return <main className={styles.page}><div className={styles.logo}>mytake<span>!</span></div><section className={styles.panel}><h1>Couldn’t load your watchlist.</h1><p className={styles.description}>We couldn’t reach your saved titles. Please try again.</p><button type="button" className={styles.submit} style={{ marginTop: 24, width: "100%" }} onClick={retry}>Try Again</button></section></main>;
}
