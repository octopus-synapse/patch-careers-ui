import { browser } from '$app/environment';

export type AppContext = 'candidate' | 'recruiter' | 'admin';

const STORAGE_KEY = 'pc:activeContext';

function isAppContext(v: unknown): v is AppContext {
  return v === 'candidate' || v === 'recruiter' || v === 'admin';
}

/**
 * Active "app context" selector. Drives which set of links the navbar shows.
 * Derives `allowedContexts` from auth role; persists the chosen context in
 * localStorage. Falls back gracefully when storage is stale or unavailable.
 *
 * Today localStorage is the only source of truth. The two TODO markers below
 * are the exact points where backend sync plugs in once UserPreferences
 * exposes `activeContext` through the generated SDK — no other shape change.
 */
export function useActiveContext(authGetter: () => { isAdmin: boolean; isLoading: boolean }) {
  let stored = $state<AppContext | null>(null);

  $effect(() => {
    if (!browser) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (isAppContext(raw)) stored = raw;
    } catch {
      // localStorage may throw in private mode / SSR-like environments.
    }
    // TODO(backend): when session.user.preferences.activeContext exists in the
    // SDK, prefer it over localStorage here and write back only when divergent.
  });

  const allowedContexts = $derived.by((): AppContext[] => {
    const auth = authGetter();
    if (auth.isLoading) return ['candidate'];
    return auth.isAdmin ? ['candidate', 'recruiter', 'admin'] : ['candidate'];
  });

  const current = $derived.by((): AppContext => {
    if (stored && allowedContexts.includes(stored)) return stored;
    return allowedContexts[0] ?? 'candidate';
  });

  function setContext(ctx: AppContext) {
    if (!allowedContexts.includes(ctx)) return;
    stored = ctx;
    if (browser) {
      try {
        localStorage.setItem(STORAGE_KEY, ctx);
      } catch {
        // Silent: persistence is best-effort.
      }
    }
    // TODO(backend): when updatePreferences endpoint is exposed via SDK, call
    // updatePreferences({ activeContext: ctx }) here as fire-and-forget so the
    // choice persists cross-device.
  }

  return {
    get current() {
      return current;
    },
    get allowedContexts() {
      return allowedContexts;
    },
    get canSwitch() {
      return allowedContexts.length > 1;
    },
    setContext,
  };
}
