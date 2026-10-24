"use client";

import { useEffect, useRef, useState } from "react";
import EpisodePicker from "./EpisodePicker";
import type { EpisodeProgress } from "@/lib/tmdb/episodes";
import Image from "next/image";
import { posterUrl, type MediaResult } from "@/lib/tmdb/media";
import { saveLibraryEntry } from "../library/actions";
import type { LibraryEntry } from "../types";
import styles from "./AddMediaDialog.module.css";

export default function AddMediaDialog({ onAdd }: { onAdd: (entry: LibraryEntry) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MediaResult | null>(null);
  const [search, setSearch] = useState<{ query: string; results: MediaResult[]; loading?: boolean; error?: string }>({ query: "", results: [] });
  const [retry, setRetry] = useState(0);
  const [status, setStatus] = useState<"In Progress" | "Completed">("Completed");
  const [progress, setProgress] = useState<EpisodeProgress | undefined>();
  const [ratingText, setRatingText] = useState("");
  const [errors, setErrors] = useState<{ title?: string; rating?: string }>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const saveErrorRef = useRef<HTMLParagraphElement>(null);
  const saveRequest = useRef<{ signature: string; id: string } | null>(null);
  const savingRef = useRef(false);
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

  useEffect(() => {
    if (!isOpen || selected || query.trim().length < 2) return;
    const controller = new AbortController();
    const term = query.trim();
    const timeout = window.setTimeout(async () => {
      setSearch({ query: term, results: [], loading: true });
      try {
        const response = await fetch(`/api/media/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok) throw new Error(data.error || "Couldn’t load results. Please try again.");
        setSearch({ query: term, results: data.results });
      } catch (error) {
        if (!controller.signal.aborted) setSearch({ query: term, results: [], error: error instanceof Error ? error.message : "Couldn’t load results. Please try again." });
      }
    }, 300);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [query, isOpen, selected, retry]);

  useEffect(() => {
    if (saveError) saveErrorRef.current?.focus();
  }, [saveError]);

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
          if (!savingRef.current) setIsOpen(false);
        }}
        onClose={() => {
          setIsOpen(false);
          setRatingText("");
          setQuery("");
          setSelected(null);
          setStatus("Completed");
          setProgress(undefined);
          setSearch({ query: "", results: [] });
          setErrors({});
          setSaveError("");
          saveRequest.current = null;
          formRef.current?.reset();
        }}
      >
        <h2 id="add-media-title">Add Media</h2>
        <p id="add-media-description">Find a story. Add your opinion so far.</p>
        <form
          ref={formRef}
          noValidate
          onSubmit={async (event) => {
            event.preventDefault();
            if (savingRef.current) return;
            const nextErrors: { title?: string; rating?: string } = {};
            const title = titleRef.current;
            const rating = ratingRef.current;

            if (!selected) nextErrors.title = "Choose a title from the search results.";
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
            if (!selected || !rating) return;
            const draft = {
              tmdbId: selected.tmdbId, mediaType: selected.mediaType,
              status, rating: rating.value === "" ? null : rating.valueAsNumber,
              progress: status === "In Progress" && selected.mediaType === "tv" ? progress : undefined,
            };
            const signature = JSON.stringify(draft);
            if (saveRequest.current?.signature !== signature) saveRequest.current = { signature, id: crypto.randomUUID() };
            savingRef.current = true;
            setSaving(true);
            setSaveError("");
            try {
              const result = await saveLibraryEntry({ ...draft, requestId: saveRequest.current.id });
              if (result.error) { setSaveError(result.error); return; }
              if (result.entry) { onAdd(result.entry); setIsOpen(false); }
            } catch {
              setSaveError("Couldn’t confirm the save. Your selections are still here; try again or refresh your library to check.");
            } finally {
              savingRef.current = false;
              setSaving(false);
            }
          }}
        >
          <fieldset className={styles.saveFields} disabled={saving}>
          <div className={styles.field}>
            <label htmlFor="media-title">Search Titles <span>Required</span></label>
            <input
              ref={titleRef}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              id="media-title"
              name="title"
              type="text"
              required
              autoFocus
              placeholder="Search movies and shows"
              value={query}
              maxLength={120}
              autoComplete="off"
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(null);
                setProgress(undefined);
                setErrors((previous) => ({ ...previous, title: undefined }));
              }}
            />
            {selected ? (
              <div className={styles.chosen}>
                {selected.posterPath && <Image src={posterUrl(selected.posterPath)} width={40} height={60} alt="" unoptimized />}
                <div><strong>{selected.title}</strong><small>{selected.year || "Year unavailable"} · {selected.mediaType === "movie" ? "Movie" : "TV Show"}</small></div>
                <span className={styles.chosenLabel}>Selected</span>
              </div>
            ) : query.trim().length >= 2 ? (
              <div className={styles.searchArea}>
                <div role="status" className={styles.searchStatus}>
                  {search.query !== query.trim() || search.loading ? "Searching…" : search.error ? search.error : search.results.length === 0 ? "No matches. Try another title." : `${search.results.length} ${search.results.length === 1 ? "match" : "matches"}. Choose a title below.`}
                </div>
                {search.query === query.trim() && search.error && <button type="button" className={styles.retry} onClick={() => setRetry((value) => value + 1)}>Try Again</button>}
                {search.query === query.trim() && !search.loading && !search.error && search.results.length > 0 && (
                  <ul className={styles.results} aria-label="Matching titles">
                    {search.results.map((result) => <li key={`${result.mediaType}-${result.tmdbId}`}>
                      <button type="button" onClick={() => { setSelected(result); setProgress(undefined); setQuery(result.title); setErrors((previous) => ({ ...previous, title: undefined })); ratingRef.current?.focus(); }}>
                        {result.posterPath ? <Image src={posterUrl(result.posterPath)} width={36} height={54} alt="" unoptimized /> : <span className={styles.noPoster} aria-hidden="true">—</span>}
                        <span><strong>{result.title}</strong><small>{result.year || "Year unavailable"} · {result.mediaType === "movie" ? "Movie" : "TV Show"}</small></span>
                      </button>
                    </li>)}
                  </ul>
                )}
              </div>
            ) : <small>Type at least two characters to search.</small>}
            {errors.title && <small id="title-error" className={styles.error} role="alert">{errors.title}</small>}
          </div>
          <fieldset className={styles.viewingStatus}>
            <legend>Viewing Status</legend>
            <div className={styles.statusOptions}>
              {(["In Progress", "Completed"] as const).map((option) => <label key={option}>
                <input type="radio" name="viewing-status" value={option} checked={status === option} onChange={() => { setStatus(option); setProgress(undefined); }} />
                <span>{option}</span>
              </label>)}
            </div>
          </fieldset>
          {isOpen && selected?.mediaType === "tv" && status === "In Progress" && <EpisodePicker key={selected.tmdbId} showId={selected.tmdbId} progress={progress} onChange={setProgress} />}
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
          </fieldset>
          {saveError && <p ref={saveErrorRef} tabIndex={-1} className={styles.saveError} role="alert">{saveError}</p>}
          <div className={styles.actions}>
            <button type="button" disabled={saving} onClick={() => setIsOpen(false)}>Cancel</button>
            <button type="submit" disabled={saving} className={styles.primary}>{saving ? "Saving…" : "Add to Library"}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
