"use client";

import { useEffect, useRef, useState } from "react";
import type { NewEntry } from "../types";
import styles from "./AddMediaDialog.module.css";

export default function AddMediaDialog({ onAdd }: { onAdd: (entry: NewEntry) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [ratingText, setRatingText] = useState("");
  const [errors, setErrors] = useState<{ title?: string; rating?: string }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const ratingRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  function adjustRating(direction: "up" | "down") {
    const input = ratingRef.current;
    if (!input) return;
    if (direction === "up") input.stepUp();
    else input.stepDown();
    setErrors((previous) => ({ ...previous, rating: undefined }));
    setRatingText(input.value);
  }

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="M12 5v14 M5 12h14" /></svg> Add Media
      </button>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="add-media-title"
        aria-describedby="add-media-description"
        onCancel={(event) => {
          event.preventDefault();
          setIsOpen(false);
        }}
        onClose={() => {
          setIsOpen(false);
          setRatingText("");
          setErrors({});
          formRef.current?.reset();
        }}
      >
        <h2 id="add-media-title">Add Media</h2>
        <p id="add-media-description">Start with a title and your opinion so far.</p>
        <form
          ref={formRef}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const nextErrors: { title?: string; rating?: string } = {};
            const title = titleRef.current;
            const rating = ratingRef.current;

            if (!title?.value.trim()) nextErrors.title = "Enter a title.";
            if (rating) {
              if (rating.validity.badInput) {
                nextErrors.rating = "Enter a number from 0 to 10.";
              } else if (rating.validity.rangeOverflow || rating.validity.rangeUnderflow) {
                nextErrors.rating = "Enter a rating from 0 to 10.";
              } else if (rating.validity.stepMismatch) {
                nextErrors.rating = "Use steps of 0.1, such as 8.8.";
              }
            }

            setErrors(nextErrors);
            if (nextErrors.title) {
              title?.focus();
              return;
            }
            if (nextErrors.rating) {
              rating?.focus();
              return;
            }
            if (!title || !rating) return;
            onAdd({
              title: title.value.trim(),
              rating: rating.value === "" ? null : rating.valueAsNumber,
            });
            setIsOpen(false);
          }}
        >
          <div className={styles.field}>
            <label htmlFor="media-title">Title <span>Required</span></label>
            <input
              ref={titleRef}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              id="media-title"
              name="title"
              type="text"
              required
              autoFocus
              placeholder="e.g. Arrival"
              onChange={() => setErrors((previous) => ({ ...previous, title: undefined }))}
            />
            {errors.title && <small id="title-error" className={styles.error} role="alert">{errors.title}</small>}
          </div>
          <div className={styles.field}>
            <label htmlFor="media-rating">Rating <span>Optional</span></label>
            <div className={`${styles.ratingControl} ${errors.rating ? styles.invalid : ""}`}>
              <button type="button" className={styles.stepButton} aria-label="Decrease rating by 0.1" onClick={() => adjustRating("down")}>−</button>
              <input
              ref={ratingRef}
              value={ratingText}
              onChange={(event) => {
                setRatingText(event.target.value);
                setErrors((previous) => ({ ...previous, rating: undefined }));
              }}
              id="media-rating"
              name="rating"
              type="number"
              min="0"
              max="10"
              step="0.1"
              aria-invalid={Boolean(errors.rating)}
              aria-describedby={errors.rating ? "rating-help rating-error" : "rating-help"}
              inputMode="decimal"
            />
              <span className={styles.ratingScale} aria-hidden="true">/ 10</span>
              <button type="button" className={styles.stepButton} aria-label="Increase rating by 0.1" onClick={() => adjustRating("up")}>+</button>
            </div>
            <small id="rating-help">Leave blank for unrated.</small>
            {errors.rating && <small id="rating-error" className={styles.error} role="alert">{errors.rating}</small>}
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={() => setIsOpen(false)}>Cancel</button>
            <button type="submit" className={styles.primary}>Add to Library</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
