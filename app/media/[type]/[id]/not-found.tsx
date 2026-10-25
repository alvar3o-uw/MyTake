import Link from "next/link";
import styles from "@/app/components/AccountPage.module.css";
export default function MediaNotFound() {
  return <main className={styles.page}><section className={styles.panel}><h1>Title not found.</h1><p className={styles.description}>This title isn’t in your library.</p><Link href="/library">Back to My Library</Link></section></main>;
}
