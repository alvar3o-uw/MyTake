"use client";

import { useActionState, useRef } from "react";
import { deleteAccount, type DeleteAccountState } from "../settings/actions";
import styles from "./DeleteAccount.module.css";

export default function DeleteAccount() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [state, action, pending] = useActionState<DeleteAccountState, FormData>(deleteAccount, {});
  return <section className={styles.section} aria-labelledby="delete-account-heading">
    <h2 id="delete-account-heading">Delete Account</h2>
    <p>Permanently remove your account and personal data.</p>
    <button ref={trigger} className={styles.danger} onClick={() => dialog.current?.showModal()}>Delete Account</button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="delete-title" aria-describedby="delete-description" onCancel={(event) => { if (pending) event.preventDefault(); }} onClose={() => trigger.current?.focus()}>
      <h2 id="delete-title">Delete your account?</h2>
      <p id="delete-description">You will permanently lose your account, profile, and all your MyTake data. This cannot be undone.</p>
      <form action={action}>
        <input type="hidden" name="confirmation" value="DELETE" />
        {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
        <div className={styles.actions}>
          <button type="button" autoFocus disabled={pending} onClick={() => dialog.current?.close()}>Keep My Account</button>
          <button type="submit" className={styles.danger} disabled={pending}>{pending ? "Deleting…" : "Delete Permanently"}</button>
        </div>
      </form>
    </dialog>
  </section>;
}
