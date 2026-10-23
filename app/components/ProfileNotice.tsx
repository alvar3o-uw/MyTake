"use client";

import { useEffect, useState } from "react";
import styles from "./ProfileNotice.module.css";

export default function ProfileNotice({ username }: { username: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisible(false);
      window.history.replaceState(null, "", "/library");
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, []);
  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    // Remove the confirmation marker without navigating or resetting the library.
    window.history.replaceState(null, "", "/library");
  }

  return (
    <div className={styles.notice} role="status">
      <div><strong>Username saved</strong><p>Your username is now <span>@{username}</span>.</p></div>
      <button type="button" onClick={dismiss} aria-label="Dismiss username confirmation">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12 M18 6 6 18" /></svg>
      </button>
    </div>
  );
}
