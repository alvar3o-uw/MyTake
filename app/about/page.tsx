import Link from "next/link";
import Image from "next/image";
import styles from "../components/AccountPage.module.css";

export const metadata = { title: "About | MyTake" };

export default function AboutPage() {
  return <main className={styles.page}>
    <Link href="/library" className={styles.logo}>mytake<span>!</span></Link>
    <section className={styles.panel} aria-labelledby="about-title">
      <h1 id="about-title">About MyTake</h1>
      <p className={styles.description}>A personal home for stories and the opinions they leave behind.</p>
      <div className={styles.credits}>
        <h2>Media Credits</h2>
        <a href="https://www.themoviedb.org/" aria-label="The Movie Database"><Image src="/tmdb-logo.svg" width={100} height={18} alt="TMDB" /></a>
        <p>Movie and television information and posters are provided by TMDB.</p>
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </div>
    </section>
    <Link href="/library" className={styles.back}>Back to My Library</Link>
  </main>;
}
