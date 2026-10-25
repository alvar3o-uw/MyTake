"use client";

import { useId, useRef, useState } from "react";
import { REVIEW_LIMIT } from "@/lib/reviews/input";
import type { ReviewResult } from "@/app/reviews/actions";
import styles from "./ReviewEditor.module.css";

export default function ReviewEditor({ initialReview, label, onSave, initialDraft, onDraftChange, onSaved, onPendingChange, disabled = false }: {
  initialReview: string | null; label: string; onSave: (draft: string) => Promise<ReviewResult>;
  initialDraft?: string; onDraftChange?: (draft: string) => void;
  onSaved?: (review: string | null) => void; onPendingChange?: (pending: boolean) => void; disabled?: boolean;
}) {
  const [saved, setSaved] = useState(initialReview);
  const [draft, setDraft] = useState(initialDraft ?? initialReview ?? "");
  const [editing, setEditing] = useState(initialDraft !== undefined && initialDraft !== (initialReview ?? ""));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const pendingRef = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const dirty = draft !== (saved ?? "");
  function change(value: string) { setDraft(value); onDraftChange?.(value); setError(""); }
  return <section className={styles.review} aria-label={label}>
    {editing ? <form onSubmit={async event => {
      event.preventDefault();
      if (pendingRef.current || disabled) return;
      pendingRef.current = true; setPending(true); onPendingChange?.(true); setError("");
      try {
        const result = await onSave(draft);
        if (result.error) { setError(result.error); return; }
        const review = result.review ?? null;
        setSaved(review); change(review ?? ""); onSaved?.(review); setEditing(false);
        requestAnimationFrame(() => editRef.current?.focus());
      } catch { setError("Couldn’t confirm your review. Your draft is still here; try again."); }
      finally { pendingRef.current = false; setPending(false); onPendingChange?.(false); }
    }}>
      <label htmlFor={`${id}-text`}>{label}</label>
      <textarea id={`${id}-text`} value={draft} maxLength={REVIEW_LIMIT} rows={6} autoFocus disabled={pending || disabled} onChange={event => change(event.target.value)} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`} />
      <div className={styles.hint} id={`${id}-help`}><span>Leave blank and save to remove your review.</span><span>{draft.length.toLocaleString()} / 10,000</span></div>
      {error && <p id={`${id}-error`} ref={errorRef} className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}><button type="button" disabled={pending || disabled} onClick={() => { change(saved ?? ""); setEditing(false); requestAnimationFrame(() => editRef.current?.focus()); }}>Cancel</button><button type="submit" className={styles.primary} disabled={pending || disabled || !dirty}>{pending ? "Saving…" : "Save Review"}</button></div>
    </form> : <>
      {saved ? <p className={styles.text}>{saved}</p> : <p className={styles.empty}>What stayed with you?</p>}
      <button ref={editRef} type="button" className={styles.edit} disabled={disabled} onClick={() => setEditing(true)}>{saved ? "Edit Review" : "Write a Review"}</button>
    </>}
  </section>;
}
