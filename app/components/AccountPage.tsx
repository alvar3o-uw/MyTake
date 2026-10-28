"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "../auth/actions";
import UiIcon from "./UiIcon";
import Link from "next/link";
import styles from "./AccountPage.module.css";

export default function AccountPage({ mode, confirmationFailed = false, passwordUpdated = false }: { mode: "sign-in" | "sign-up"; confirmationFailed?: boolean; passwordUpdated?: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(authenticate.bind(null, mode), {});
  const [email, setEmail] = useState("");
  const signingUp = mode === "sign-up";

  return (
    <main className={styles.page}>
      <Link href="/library" className={styles.logo} aria-label="MyTake — My Library">mytake<span>!</span></Link>
      <section className={styles.panel} aria-labelledby="account-heading">
        <h1 id="account-heading">{signingUp ? "Make it your take." : "Welcome back."}</h1>
        <p className={styles.description}>{signingUp ? "A home for your stories and opinions." : "Your next great take starts here."}</p>
        {passwordUpdated && <div className={`${styles.notice} ${styles.message} ${styles.recoveryNotice}`} role="status"><h2>Password updated</h2><p>Sign in with your new password.</p></div>}
        <form action={action} className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required minLength={signingUp ? 8 : undefined} autoComplete={signingUp ? "new-password" : "current-password"} placeholder={signingUp ? "Create a password" : "Enter your password"} />
          </div>
          {!signingUp && <Link className={styles.forgot} href="/forgot-password">Forgot Password?</Link>}
          {signingUp && (
            <div className={styles.field}>
              <label htmlFor="confirm-password">Re-enter Password</label>
              <input id="confirm-password" name="confirmPassword" type="password" required autoComplete="new-password" placeholder="Re-enter your password" />
            </div>
          )}
          {(state.error || confirmationFailed) && (
            <div className={`${styles.notice} ${styles.error}`} role="alert">
              <h2>{confirmationFailed && !state.error ? "Link expired" : "Let’s try that again"}</h2>
              <p>{state.error || "That confirmation link is invalid or expired. Try signing in if you already confirmed your email."}</p>
            </div>
          )}
          {state.message && (
            <div className={`${styles.notice} ${styles.message}`} role="status">
              <h2>Check your inbox</h2>
              <p>Confirm your email to finish setting up your account.</p>
              <Link href="/sign-in">Continue to Sign In</Link>
            </div>
          )}
          <button type="submit" disabled={pending} className={styles.submit}>{pending ? "Please Wait…" : signingUp ? "Create Account" : "Sign In"}</button>
        </form>
        <p className={styles.switch}>{signingUp ? "Already have an account?" : "New to MyTake?"} <Link href={signingUp ? "/sign-in" : "/sign-up"}>{signingUp ? "Sign In" : "Sign Up"}</Link></p>
      </section>
      <Link href="/" className={styles.back}><UiIcon name="back" />Back to Home</Link>
    </main>
  );
}
