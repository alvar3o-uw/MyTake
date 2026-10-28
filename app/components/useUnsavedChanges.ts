"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function navigateWithUnsavedCheck(go: () => void) {
  const event = new CustomEvent("mytake-before-navigate", { cancelable: true, detail: go });
  if (window.dispatchEvent(event)) go();
}

export default function useUnsavedChanges(dirty: boolean) {
  const router = useRouter();
  const leaveAction = useRef<(() => void) | null>(null);
  const [show, setShow] = useState(false);
  const bypass = useRef(false);
  useEffect(() => {
    if (!dirty) return;
    function ask(go: () => void) { leaveAction.current = go; setShow(true); }
    function unload(event: BeforeUnloadEvent) { if (!bypass.current) { event.preventDefault(); event.returnValue = ""; } }
    function navigate(event: Event) {
      if (bypass.current) return;
      event.preventDefault(); ask((event as CustomEvent<() => void>).detail);
    }
    function click(event: MouseEvent) {
      if (bypass.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href);
      if (destination.pathname === location.pathname && destination.search === location.search) return;
      event.preventDefault(); event.stopPropagation();
      ask(() => destination.origin === location.origin ? router.push(destination.pathname + destination.search + destination.hash) : location.assign(destination.href));
    }
    const originalState = history.state;
    if (!history.state?.mytakeUnsavedGuard) history.pushState({ ...originalState, mytakeUnsavedGuard: true }, "", location.href);
    function back(event: PopStateEvent) {
      if (bypass.current) return;
      event.stopImmediatePropagation();
      history.pushState({ ...history.state, mytakeUnsavedGuard: true }, "", location.href);
      ask(() => history.go(-2));
    }
    window.addEventListener("beforeunload", unload);
    window.addEventListener("mytake-before-navigate", navigate);
    document.addEventListener("click", click, true);
    window.addEventListener("popstate", back, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("mytake-before-navigate", navigate);
      document.removeEventListener("click", click, true);
      window.removeEventListener("popstate", back, true);
    };
  }, [dirty, router]);
  const onStay = useCallback(() => { leaveAction.current = null; setShow(false); }, []);
  const onLeave = useCallback(() => { bypass.current = true; setShow(false); leaveAction.current?.(); }, []);
  return { show, onStay, onLeave };
}
