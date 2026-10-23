import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/profiles/server";
import ProfileForm from "@/app/components/ProfileForm";
import styles from "../../components/AccountPage.module.css";

export default async function ProfileSetupPage() {
  const { profile } = await getOwnProfile();
  if (profile) redirect("/library");
  return <main className={styles.page}>
    <Link href="/" className={styles.logo}>mytake<span>!</span></Link>
    <section className={styles.panel} aria-labelledby="setup-title">
      <h1 id="setup-title">Make it yours.</h1>
      <p className={styles.description}>Choose a unique username for your MyTake profile.</p>
      <ProfileForm mode="setup" />
    </section>
    <Link href="/" className={styles.back}>Back to Home</Link>
  </main>;
}
