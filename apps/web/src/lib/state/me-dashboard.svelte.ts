import { isApiError, type PagesMeDashboard200, pagesMeDashboard } from 'api-client';
import { browser } from '$app/environment';

let cached = $state<PagesMeDashboard200 | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);
let fetchedAt = $state<number | null>(null);

async function fetchMeDashboard(): Promise<PagesMeDashboard200 | null> {
  if (!browser) return null;
  loading = true;
  error = null;
  try {
    cached = await pagesMeDashboard();
    fetchedAt = Date.now();
    return cached;
  } catch (err) {
    // 404 is expected on backends that don't have the composite endpoint
    // wired yet; widgets fall back to their own per-widget fetches.
    if (isApiError(err) && err.statusCode !== 404) {
      error = `HTTP ${err.statusCode}`;
    }
    return null;
  } finally {
    loading = false;
  }
}

export const meDashboard = {
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
  /**
   * Trigger a fetch. Idempotent within the staleness window — repeated
   * calls within 30s reuse the cached payload instead of round-tripping.
   */
  async load(force = false): Promise<PagesMeDashboard200 | null> {
    const STALE_MS = 30_000;
    if (!force && cached && fetchedAt && Date.now() - fetchedAt < STALE_MS) {
      return cached;
    }
    return fetchMeDashboard();
  },
  /**
   * Discard the cached payload. Call after an action that mutates one of
   * the underlying entities (apply to job, mark notification read, etc).
   */
  invalidate(): void {
    cached = null;
    fetchedAt = null;
  },
};
