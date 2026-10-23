import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/profiles/server";
import DeleteAccount from "../components/DeleteAccount";
import ProfileForm from "../components/ProfileForm";
import UiIcon from "../components/UiIcon";
import styles from "../components/AccountPage.module.css";

export default async function SettingsPage() {
  const { profile } = await getOwnProfile();
  if (!profile) redirect("/profile/setup");
  return <main className={styles.page}>
    <Link href="/library" className={styles.logo} aria-label="My Library">mytake<span>!</span></Link>
    <section className={styles.panel} aria-labelledby="settings-title">
      <h1 id="settings-title">Settings</h1>
      <p className={styles.description}>Make your profile feel like you.</p>
      <ProfileForm mode="settings" username={profile.username} />
      <DeleteAccount />
    </section>
    <Link href="/library" className={styles.back}><UiIcon name="back" />Back to My Library</Link>
  </main>;
}
