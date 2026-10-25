"use client";

import { useEffect, useId, useRef, useState } from "react";
import { removeLibraryEntry, setTitleFavourite } from "../library/actions";
import type { LibraryEntry } from "../types";
import EditEntryDialog from "./EditEntryDialog";
import UiIcon from "./UiIcon";
import styles from "./LibraryEntryMenu.module.css";

export default function LibraryEntryMenu({ entry, onRemoved, onUpdated, compact = false }: {
  compact?: boolean; entry: LibraryEntry; onRemoved: (entryId: string) => void; onUpdated: (entry: LibraryEntry) => void;
}) {
  const { id: entryId, title } = entry;
  const [panelPosition, setPanelPosition] = useState<{ left: number; top: number } | undefined>();
  const [favouritePending, setFavouritePending] = useState(false);
  const [favouriteError, setFavouriteError] = useState("");
  const [editing, setEditing] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const dialogId = useId();

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (menu.current && !menu.current.contains(event.target as Node)) menu.current.open = false;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && menu.current?.open && !dialog.current?.open) {
        menu.current.open = false;
        trigger.current?.focus();
      }
    }
    function closeOnScroll() { if (compact && menu.current) menu.current.open = false; }
    window.addEventListener("scroll", closeOnScroll);
    window.addEventListener("resize", closeOnScroll);
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("scroll", closeOnScroll);
      window.removeEventListener("resize", closeOnScroll);
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [compact]);

  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  async function remove() {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError("");
    try {
      const result = await removeLibraryEntry(entryId, true);
      if (result.error) { setError(result.error); return; }
      if (result.removedId !== entryId) { setError("Couldn’t confirm removal. Please try again."); return; }
      dialog.current?.close();
      onRemoved(result.removedId);
    } catch {
      setError("Couldn’t confirm removal. Try again or refresh your library to check.");
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return <>
    <details className={styles.menu} ref={menu} onToggle={event => {
      if (compact && event.currentTarget.open) {
        const rect = trigger.current?.getBoundingClientRect();
        if (rect) setPanelPosition({ left: Math.max(12, Math.min(rect.right - 210, window.innerWidth - 222)), top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 210)) });
      }
    }}>
      <summary ref={trigger} aria-label={`Options for ${title}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
      </summary>
      <div className={styles.panel} style={compact && panelPosition ? { position: "fixed", ...panelPosition, right: "auto", maxHeight: "calc(100vh - 24px)", overflowY: "auto" } : undefined}>
        <button type="button" className={styles.edit} disabled={favouritePending || pending} aria-pressed={Boolean(entry.isFavourite)} onClick={async () => {
          if (pendingRef.current) return;
          pendingRef.current = true; setFavouritePending(true); setFavouriteError("");
          try {
            const result = await setTitleFavourite(entryId, !entry.isFavourite);
            if (result.error) { setFavouriteError(result.error); if (menu.current) menu.current.open = true; return; }
            if (!result.entry) { setFavouriteError("Couldn’t confirm your favourite. Please refresh to check."); return; }
            onUpdated(result.entry);
            if (menu.current) menu.current.open = false;
            trigger.current?.focus();
          } catch { setFavouriteError("Couldn’t confirm your favourite. Try again or refresh."); if (menu.current) menu.current.open = true; }
          finally { pendingRef.current = false; setFavouritePending(false); }
        }}><UiIcon name="star" className={entry.isFavourite ? styles.filledStar : undefined} />{favouritePending ? "Updating…" : entry.isFavourite ? "Remove from Favourites" : "Add to Favourites"}</button>
        {favouriteError && <p className={styles.menuError} role="alert">{favouriteError}</p>}
        <button type="button" className={styles.edit} disabled={favouritePending || pending} aria-haspopup="dialog" onClick={() => { if (menu.current) menu.current.open = false; setEditing(true); }}><UiIcon name="edit" />Edit Entry</button>
        <button type="button" disabled={favouritePending || pending} aria-haspopup="dialog" onClick={() => { if (menu.current) menu.current.open = false; setError(""); dialog.current?.showModal(); }}><UiIcon name="trash" />Remove from Library</button>
      </div>
    </details>
    {editing && <EditEntryDialog entry={entry} onSaved={onUpdated} onClose={() => { setEditing(false); trigger.current?.focus(); }} />}
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={dialogId} aria-describedby={`${dialogId}-description`}
      onCancel={(event) => { if (pendingRef.current) event.preventDefault(); }}
      onClose={() => { if (trigger.current?.isConnected) trigger.current.focus(); }}>
      <h2 id={dialogId}>Remove from your library?</h2>
      <p id={`${dialogId}-description`}>Your rating and viewing progress for <strong>{title}</strong> will be deleted. You can add the title again, but its previous rating and progress won’t be restored.</p>
      {error && <p ref={errorRef} tabIndex={-1} className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}>
        <button type="button" autoFocus disabled={pending} onClick={() => dialog.current?.close()}>Keep Entry</button>
        <button type="button" className={styles.remove} disabled={pending} onClick={remove}>{pending ? "Removing…" : "Remove Entry"}</button>
      </div>
    </dialog>
  </>;
}
