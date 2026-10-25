import Link from "next/link";
import AccountMenu from "./AccountMenu";
import UiIcon from "./UiIcon";
import styles from "../library/page.module.css";
export default function CollectionHeader({ username, active }: {
    username: string;
    active: "library" | "watchlist" | "profile";
}) {
    return <header className={styles.header}>
    <Link href="/library" className={styles.wordmark} aria-label="MyTake — My Library">mytake<span>!</span></Link>
    <nav aria-label="Main navigation" className={styles.navigation}>
      <Link href="/library" className={active === "library" ? styles.active : undefined} aria-current={active === "library" ? "page" : undefined}><UiIcon name="books" className={styles.icon}/>Library</Link>
      <Link href="/watchlist" className={active === "watchlist" ? styles.active : undefined} aria-current={active === "watchlist" ? "page" : undefined}><UiIcon name="bookmark" className={styles.icon}/>Watchlist</Link>
    </nav>
    <AccountMenu username={username}/>
  </header>;
}
