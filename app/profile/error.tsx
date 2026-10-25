"use client";
import styles from "../components/AccountPage.module.css";
export default function ProfileError({ retry }: { retry: () => void }) {
  return <main className={styles.page}><section className={styles.panel}><h1>Couldn’t load your profile.</h1><p className={styles.description}>Please try again to load your titles.</p><button type="button" className={styles.submit} onClick={retry}>Try Again</button></section></main>;
}
