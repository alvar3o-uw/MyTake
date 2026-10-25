"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthState } from "../auth/actions";
import { requestPasswordReset, updateRecoveredPassword } from "../auth/recovery-actions";
import styles from "./AccountPage.module.css";

export default function PasswordRecoveryForm({ reset = false, invalidLink = false }: { reset?: boolean; invalidLink?: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(reset ? updateRecoveredPassword : requestPasswordReset, {});
  return <main className={styles.page}>
    <Link href="/library" className={styles.logo} aria-label="MyTake — My Library">mytake<span>!</span></Link>
    <section className={styles.panel} aria-labelledby="recovery-heading">
      <h1 id="recovery-heading">{reset ? "A fresh start." : "Forgot your password?"}</h1>
      <p className={styles.description}>{reset ? "Choose a new password for your account." : "We’ll email you a link to reset it."}</p>
      {invalidLink && !state.message && <div className={`${styles.notice} ${styles.error} ${styles.recoveryNotice}`} role="alert"><h2>That link didn’t work</h2><p>It may have expired or already been used. Request a new link, then open it in the same browser and device you use here.</p></div>}
      {state.message ? <div className={`${styles.notice} ${styles.message} ${styles.recoveryNotice}`} role="status"><h2>{reset ? "Password updated" : "Check your inbox"}</h2><p>{state.message}</p>{!reset && <p>Open the latest link in this same browser and device. Check your spam folder too.</p>}<Link href="/sign-in">Continue to Sign In</Link></div> : <form action={action} className={styles.fields}>
        {reset ? <>
          <div className={styles.field}><label htmlFor="new-password">New Password</label><input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required disabled={pending} /></div>
          <div className={styles.field}><label htmlFor="confirm-new-password">Re-enter Password</label><input id="confirm-new-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required disabled={pending} /></div>
        </> : <div className={styles.field}><label htmlFor="recovery-email">Email</label><input id="recovery-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required disabled={pending} /></div>}
        {state.error && <div className={`${styles.notice} ${styles.error}`} role="alert"><h2>Let’s try that again</h2><p>{state.error}</p>{reset && <Link href="/forgot-password">Request a new reset link</Link>}</div>}
        <button className={styles.submit} type="submit" disabled={pending}>{pending ? "Please Wait…" : reset ? "Update Password" : "Send Reset Link"}</button>
      </form>}
      <p className={styles.switch}><Link href="/sign-in">Back to Sign In</Link></p>
    </section>
  </main>;
}
