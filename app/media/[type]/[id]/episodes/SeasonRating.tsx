"use client";

import { useId, useRef, useState } from "react";
import { saveSeasonRating } from "./actions";
import styles from "./page.module.css";

export default function SeasonRating({ entryId, season, name, rating, draft, onDraftChange, onSaved, onPendingChange, disabled }: {
  entryId: string; season: number; name: string; rating: number | null; draft: string;
  onDraftChange: (draft: string) => void; onSaved: (rating: number | null) => void;
  onPendingChange: (pending: boolean) => void; disabled: boolean;
}) {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [error, setError] = useState("");
  const id = useId();
  return <form id="season-rating" tabIndex={-1} className={styles.seasonRating} onSubmit={async event => {
    event.preventDefault();
    if (pendingRef.current || disabled) return;
    pendingRef.current = true; setPending(true); onPendingChange(true); setError("");
    try {
      const result = await saveSeasonRating(entryId, season, draft === "" ? null : Number(draft));
      if (result.error) { setError(result.error); return; }
      onSaved(result.rating ?? null);
    } catch { setError("Couldn’t confirm your season rating. Your draft is still here; try again."); }
    finally { pendingRef.current = false; setPending(false); onPendingChange(false); }
  }}>
    <div><h2>Your Season Rating</h2><p>{name}</p></div>
    <div className={styles.controls}>
      <label className={styles.score}><span className={styles.srOnly}>Rating for {name}</span><input type="number" min="0" max="10" step="0.1" inputMode="decimal" value={draft} disabled={disabled || pending} onChange={event => { onDraftChange(event.target.value); setError(""); }} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`} /><span aria-hidden="true">/10</span></label>
      <button type="submit" disabled={disabled || pending || (draft === (rating === null ? "" : String(rating)) && !error)}>{pending ? "Saving…" : "Save Season Rating"}</button>
    </div>
    <small id={`${id}-help`} className={styles.seasonHelp}>Leave blank and save to clear your season rating.</small>
    {error && <p id={`${id}-error`} role="alert" className={styles.error}>{error}</p>}
  </form>;
}
