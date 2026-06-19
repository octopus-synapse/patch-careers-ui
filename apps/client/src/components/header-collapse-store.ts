/**
 * Tiny shared store coordinating the global AppHeader's collapse with a
 * screen's scroll. The Vagas screen pushes a `collapsed` flag as the user
 * scrolls (down → collapse to just the search; up / near-top → restore) and
 * the header subscribes and animates between its full and collapsed states.
 *
 * Hand-rolled via `useSyncExternalStore` (no extra dependency) and module-level
 * so the header and any scroll source share one source of truth. Screens that
 * drive it must reset it to `false` on blur so the collapse never leaks onto
 * another tab.
 */

import { useSyncExternalStore } from "react";

let collapsed = false;
const listeners = new Set<() => void>();

export function setHeaderCollapsed(value: boolean): void {
  if (collapsed === value) return;
  collapsed = value;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHeaderCollapsed(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => collapsed,
    () => collapsed,
  );
}
