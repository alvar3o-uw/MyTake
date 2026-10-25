"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import SignOutButton from "./SignOutButton";
import UiIcon from "./UiIcon";
import styles from "./AccountMenu.module.css";

export default function AccountMenu({ username }: { username: string }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) menuRef.current.open = false;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && menuRef.current?.open) {
        menuRef.current.open = false;
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return <details className={styles.menu} ref={menuRef}>
    <summary ref={triggerRef} aria-label={`Account options for ${username}`}>
      <span className={styles.avatar} aria-hidden="true">{username.charAt(0).toUpperCase()}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
    </summary>
    <div className={styles.panel}>
      <div className={styles.identity}><span>Your Account</span><strong>@{username}</strong></div>
      <div className={styles.items}>
        <Link href="/profile" onClick={() => { if (menuRef.current) menuRef.current.open = false; }}><UiIcon name="profile" />Profile</Link>
        <Link href="/settings"><UiIcon name="settings" />Settings</Link>
        <SignOutButton />
      </div>
    </div>
  </details>;
}
