"use client";
import { useEffect, useRef } from "react";
import styles from "./UnsavedChangesDialog.module.css";

export default function UnsavedChangesDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="unsaved-title" aria-describedby="unsaved-description" onCancel={event => { event.preventDefault(); onStay(); }}>
    <h2 id="unsaved-title">Leave without saving?</h2>
    <p id="unsaved-description">Your unsaved ratings and reviews will be lost.</p>
    <div><button type="button" autoFocus onClick={onStay}>Keep Editing</button><button type="button" className={styles.leave} onClick={onLeave}>Discard & Leave</button></div>
  </dialog>;
}
