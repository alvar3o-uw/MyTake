"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "../profile/actions";
import styles from "./ProfileForm.module.css";

export default function ProfileForm({ mode, username = "" }: { mode: "setup" | "settings"; username?: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile.bind(null, mode), { username });
  return <form action={action} className={styles.form}>
    <div className={styles.field}>
      <label htmlFor="username">Username</label>
      <div className={styles.inputWrap}>
        <span aria-hidden="true">@</span>
        <input id="username" name="username" defaultValue={state.username ?? username} autoComplete="username" autoCapitalize="none" spellCheck={false} required minLength={3} maxLength={20} pattern="[a-z0-9_]{3,20}" aria-describedby={state.error ? "username-help username-error" : "username-help"} aria-invalid={Boolean(state.error)} />
      </div>
      <small id="username-help">3–20 lowercase letters, numbers, or underscores.</small>
    </div>
    {state.error && <p id="username-error" className={styles.error} role="alert">{state.error}</p>}
    {state.message && <p className={styles.success} role="status">{state.message}</p>}
    <button type="submit" disabled={pending}>{pending ? "Saving…" : mode === "setup" ? "Continue to My Library" : "Save Changes"}</button>
  </form>;
}
