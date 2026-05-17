import { type GetV1PagesMeDashboard200, getV1PagesMeDashboard, isApiError } from 'api-client';
import { getContext, setContext } from 'svelte';
import { browser } from '$app/environment';

const STALE_MS = 30_000;

export type MeDashboardStore = ReturnType<typeof createMeDashboardStore>;

export function createMeDashboardStore() {
  let cached = $state<GetV1PagesMeDashboard200 | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let fetchedAt = $state<number | null>(null);

  async function fetchMeDashboard(): Promise<GetV1PagesMeDashboard200 | null> {
    if (!browser) return null;
    loading = true;
    error = null;
    try {
      cached = await getV1PagesMeDashboard();
      fetchedAt = Date.now();
      return cached;
    } catch (err) {
      if (isApiError(err) && err.statusCode !== 404) {
        error = `HTTP ${err.statusCode}`;
      }
      return null;
    } finally {
      loading = false;
    }
  }

  return {
    get data() {
      return cached;
    },
    get widgets() {
      return cached?.widgets ?? [];
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    get fetchedAt() {
      return fetchedAt;
    },
    async load(force = false): Promise<GetV1PagesMeDashboard200 | null> {
      if (!force && cached && fetchedAt && Date.now() - fetchedAt < STALE_MS) {
        return cached;
      }
      return fetchMeDashboard();
    },
    invalidate(): void {
      cached = null;
      fetchedAt = null;
    },
  };
}

const KEY = Symbol('me-dashboard-store');

export function setMeDashboardStore(
  store: MeDashboardStore = createMeDashboardStore(),
): MeDashboardStore {
  setContext(KEY, store);
  return store;
}

export function useMeDashboard(): MeDashboardStore {
  const store = getContext<MeDashboardStore | undefined>(KEY);
  if (!store) {
    throw new Error('useMeDashboard() called without setMeDashboardStore() in an ancestor layout');
  }
  return store;
}
