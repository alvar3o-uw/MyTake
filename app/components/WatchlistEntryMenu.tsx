"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { WatchlistEntry } from "@/lib/watchlist/records";
import { removeWatchlistEntry } from "../watchlist/actions";
import EditEntryDialog from "./EditEntryDialog";
import UiIcon from "./UiIcon";
import styles from "./LibraryEntryMenu.module.css";
export default function WatchlistEntryMenu({ entry, onRemoved }: {
    entry: WatchlistEntry;
    onRemoved: (id: string) => void;
}) {
    const menu = useRef<HTMLDetailsElement>(null);
    const trigger = useRef<HTMLElement>(null);
    const dialog = useRef<HTMLDialogElement>(null);
    const errorRef = useRef<HTMLParagraphElement>(null);
    const busy = useRef(false);
    const [moving, setMoving] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const id = useId();
    useEffect(() => {
        function outside(event: PointerEvent) { if (menu.current && !menu.current.contains(event.target as Node))
            menu.current.open = false; }
        function escape(event: KeyboardEvent) { if (event.key === "Escape" && menu.current?.open) {
            menu.current.open = false;
            trigger.current?.focus();
        } }
        document.addEventListener("pointerdown", outside);
        document.addEventListener("keydown", escape);
        return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
    }, []);
    useEffect(() => { if (error)
        errorRef.current?.focus(); }, [error]);
    return <>
  <details ref={menu} className={styles.menu}><summary ref={trigger} aria-label={`Options for ${entry.title}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></summary><div className={styles.panel}>
   <button type="button" className={styles.edit} aria-haspopup="dialog" onClick={() => { if (menu.current)
        menu.current.open = false; setMoving(true); }}><UiIcon name="books"/>Move to Library</button>
   <button type="button" aria-haspopup="dialog" onClick={() => { if (menu.current)
        menu.current.open = false; setError(""); dialog.current?.showModal(); }}><UiIcon name="trash"/>Remove from Watchlist</button>
  </div></details>
  {moving && <EditEntryDialog mode="move" entry={{ ...entry, rating: null, status: "Completed" }} onSaved={() => onRemoved(entry.id)} onClose={() => { setMoving(false); trigger.current?.focus(); }}/>}
  <dialog ref={dialog} className={styles.dialog} aria-labelledby={id} aria-describedby={`${id}-description`} onCancel={event => { if (busy.current)
        event.preventDefault(); }} onClose={() => trigger.current?.focus()}>
   <h2 id={id}>Remove from your watchlist?</h2><p id={`${id}-description`}>Remove <strong>{entry.title}</strong> from your watchlist? You can add it again whenever you like.</p>
   {error && <p ref={errorRef} tabIndex={-1} role="alert" className={styles.error}>{error}</p>}
   <div className={styles.actions}><button type="button" autoFocus disabled={pending} onClick={() => dialog.current?.close()}>Keep Title</button><button type="button" className={styles.remove} disabled={pending} onClick={async () => {
            if (busy.current)
                return;
            busy.current = true;
            setPending(true);
            setError("");
            try {
                const result = await removeWatchlistEntry(entry.id, true);
                if (result.error) {
                    setError(result.error);
                    return;
                }
                if (result.removedId !== entry.id) {
                    setError("Couldn’t confirm removal. Please try again.");
                    return;
                }
                dialog.current?.close();
                onRemoved(entry.id);
            }
            catch {
                setError("Couldn’t confirm removal. Try again or refresh to check.");
            }
            finally {
                busy.current = false;
                setPending(false);
            }
        }}>{pending ? "Removing…" : "Remove Title"}</button></div>
  </dialog>
 </>;
}
