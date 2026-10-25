import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PasswordRecoveryForm from "../components/PasswordRecoveryForm";
import styles from "../components/AccountPage.module.css";
export const metadata: Metadata = { title: "Reset Password | MyTake", robots: { index: false, follow: false } };
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return <main className={styles.page}><Link href="/library" className={styles.logo}>mytake<span>!</span></Link><section className={styles.panel}><h1>Request a fresh link.</h1><p className={styles.description}>Open the latest password reset email in the same browser that requested it.</p><p className={styles.switch}><Link href="/forgot-password">Request a Reset Link</Link></p></section></main>;
  return <PasswordRecoveryForm reset />;
}
