"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import type { LibraryEntry } from "../types";
import { updateLibraryEntry } from "../library/actions";
import { posterUrl } from "@/lib/tmdb/media";
import EpisodePicker from "./EpisodePicker";
import styles from "./AddMediaDialog.module.css";

export default function EditEntryDialog({ entry, onSaved, onClose }: {
  entry: LibraryEntry; onSaved: (entry: LibraryEntry) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ratingInput = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const pendingRef = useRef(false);
  const [rating, setRating] = useState(entry.rating === null ? "" : String(entry.rating));
  const [status, setStatus] = useState(entry.status);
  const [progress, setProgress] = useState(entry.progress);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const id = useId();

  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  function adjust(direction: "up" | "down") {
    const input = ratingInput.current;
    if (!input) return;
    if (direction === "up") input.stepUp(); else input.stepDown();
    setRating(input.value);
  }

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`} onClose={onClose} onCancel={(event) => { if (pendingRef.current) event.preventDefault(); }}>
    <h2 id={`${id}-title`}>Edit Entry</h2>
    <p>Update your opinion and viewing progress.</p>
    <div className={`${styles.chosen} ${styles.editMedia}`}>
      {entry.posterPath && <Image src={posterUrl(entry.posterPath)} width={40} height={60} alt="" unoptimized />}
      <div><strong>{entry.title}</strong><small>{entry.year || "Year unavailable"} · {entry.type}</small></div>
    </div>
    <form onSubmit={async (event) => {
      event.preventDefault();
      if (pendingRef.current || !ratingInput.current) return;
      pendingRef.current = true;
      setPending(true);
      setError("");
      try {
        const result = await updateLibraryEntry(entry.id, {
          rating: ratingInput.current.value === "" ? null : ratingInput.current.valueAsNumber,
          status, progress: status === "In Progress" && entry.mediaType === "tv" ? progress : undefined,
        });
        if (result.error) { setError(result.error); return; }
        if (result.entry) { onSaved(result.entry); dialog.current?.close(); }
      } catch {
        setError("Couldn’t confirm your changes. Your edits are still here; try again or refresh your library to check.");
      } finally {
        pendingRef.current = false;
        setPending(false);
      }
    }}>
      <fieldset className={styles.saveFields} disabled={pending}>
        <fieldset className={styles.viewingStatus}>
          <legend>Viewing Status</legend>
          <div className={styles.statusOptions}>
            {(["In Progress", "Completed"] as const).map((option) => <label key={option}>
              <input type="radio" name={`${id}-status`} value={option} checked={status === option} onChange={() => { setStatus(option); setProgress(undefined); }} />
              <span>{option}</span>
            </label>)}
          </div>
        </fieldset>
        {entry.mediaType === "tv" && status === "In Progress" && <EpisodePicker showId={entry.tmdbId} progress={progress} onChange={setProgress} />}
        <div className={styles.field}>
          <label htmlFor={`${id}-rating`}>Rating <span>Optional</span></label>
          <div className={styles.ratingControl}>
            <button type="button" className={styles.stepButton} aria-label="Decrease rating by 0.1" onClick={() => adjust("down")}>−</button>
            <input ref={ratingInput} id={`${id}-rating`} name="rating" type="number" min="0" max="10" step="0.1" inputMode="decimal" value={rating} onChange={(event) => setRating(event.target.value)} autoFocus aria-describedby={`${id}-rating-help`} />
            <span className={styles.ratingScale} aria-hidden="true">/ 10</span>
            <button type="button" className={styles.stepButton} aria-label="Increase rating by 0.1" onClick={() => adjust("up")}>+</button>
          </div>
          <small id={`${id}-rating-help`}>Leave blank for unrated.</small>
        </div>
      </fieldset>
      {error && <p ref={errorRef} tabIndex={-1} className={styles.saveError} role="alert">{error}</p>}
      <div className={styles.actions}>
        <button type="button" disabled={pending} onClick={() => dialog.current?.close()}>Cancel</button>
        <button type="submit" className={styles.primary} disabled={pending}>{pending ? "Saving…" : "Save Changes"}</button>
      </div>
    </form>
  </dialog>;
}
