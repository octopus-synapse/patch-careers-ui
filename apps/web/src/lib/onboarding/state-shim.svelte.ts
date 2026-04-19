/**
 * Onboarding state shim — a defensive localStorage mirror for the onboarding
 * session. The backend owns the real state via `createOnboardingGetSession`,
 * but the `CacheLockService` race on concurrent step saves can momentarily
 * wipe server state. This shim holds a client-side backup so a refresh or
 * tab reload can fall back to the last known good snapshot.
 *
 * Usage inside +page.svelte:
 *   const shim = onboardingStateShim();
 *   $effect(() => shim.snapshot(session.data));
 *   const fallback = shim.read();
 *   const displayData = session.data ?? fallback;
 */

const KEY = 'onboarding:session-snapshot';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

interface Snapshot<T> {
  data: T;
  savedAt: number;
}

export function onboardingStateShim<T extends Record<string, unknown>>() {
  let snapshot = $state<T | null>(null);

  // Hydrate on mount.
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Snapshot<T>;
        if (Date.now() - parsed.savedAt < MAX_AGE_MS) {
          snapshot = parsed.data;
        } else {
          window.localStorage.removeItem(KEY);
        }
      }
    } catch {
      // storage disabled — no-op.
    }
  }

  function mirror(data: T | null | undefined): void {
    if (!data || typeof window === 'undefined') return;
    try {
      const payload: Snapshot<T> = { data, savedAt: Date.now() };
      window.localStorage.setItem(KEY, JSON.stringify(payload));
      snapshot = data;
    } catch {
      // ignore
    }
  }

  function clear(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    snapshot = null;
  }

  return {
    get snapshot() {
      return snapshot;
    },
    mirror,
    clear,
  };
}
