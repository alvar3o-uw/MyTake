"use client";

import { useState } from "react";
import { signOut } from "../auth/actions";
import UiIcon from "./UiIcon";
import styles from "./SignOutButton.module.css";

export default function SignOutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return <div className={styles.control}>
    <button type="button" disabled={pending} onClick={async () => {
      setPending(true);
      setError("");
      try {
        const result = await signOut();
        setError(result.error ?? "");
      } finally { setPending(false); }
    }}><UiIcon name="signOut" /><span>{pending ? "Signing Out…" : "Sign Out"}</span></button>
    {error && <p role="alert">{error}</p>}
  </div>;
}
