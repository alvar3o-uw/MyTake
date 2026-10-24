"use client";

import styles from "../components/AccountPage.module.css";

export default function LibraryError({ retry }: { retry: () => void }) {
  return <main className={styles.page}>
    <div className={styles.logo}>mytake<span>!</span></div>
    <section className={styles.panel}>
      <h1>Couldn’t load your library.</h1>
      <p className={styles.description}>We couldn’t reach your saved entries. Please try again.</p>
      <button type="button" className={styles.submit} style={{ marginTop: 24, width: "100%" }} onClick={retry}>Try Again</button>
    </section>
  </main>;
}
