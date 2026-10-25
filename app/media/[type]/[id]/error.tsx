"use client";
import Link from "next/link";
import styles from "@/app/components/AccountPage.module.css";
export default function MediaError({ retry }: { retry: () => void }) {
  return <main className={styles.page}><section className={styles.panel}><h1>Couldn’t load this title.</h1><p className={styles.description}>Please try again to load your saved take.</p><button type="button" className={styles.submit} onClick={retry}>Try Again</button><Link href="/library">Back to My Library</Link></section></main>;
}
