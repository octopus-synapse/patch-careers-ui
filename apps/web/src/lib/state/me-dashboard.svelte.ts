import { browser } from '$app/environment';

/**
 * Server-driven payload for the dashboard page.
 *
 * Backend endpoint: GET /v1/pages/me-dashboard (controller in
 * profile-services: bounded-contexts/platform/ui-metadata/controllers/
 * me-dashboard.controller.ts).
 *
 * The composite collapses what was N parallel widget fetches (resumes,
 * applications, notifications, viewer summary, recent activity) into one
 * round-trip. Widgets that opt in read from this store; widgets that
 * haven't been migrated yet keep their own per-widget fetch and just
 * never touch this store — both paths coexist while we migrate.
 *
 * SDK is currently stale for the `pages` namespace, so this uses fetch
 * directly; swap to the SDK call once orval picks up the controller.
 */
export interface MeDashboardCounts {
  resumes?: number;
  applications?: number;
  unreadNotifications?: number;
}

export interface MeDashboardActivity {
  id: string;
  type?: string;
  createdAt?: string | null;
  [key: string]: unknown;
}

export interface MeDashboardViewer {
  id?: string;
  name?: string | null;
  email?: string;
  profileCompletion?: number;
  [key: string]: unknown;
}

export interface MeDashboardPayload {
  counts?: MeDashboardCounts;
  recentActivity?: MeDashboardActivity[];
  viewer?: MeDashboardViewer;
  [key: string]: unknown;
}

let cached = $state<MeDashboardPayload | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);
let fetchedAt = $state<number | null>(null);

async function fetchMeDashboard(): Promise<MeDashboardPayload | null> {
  if (!browser) return null;
  loading = true;
  error = null;
  try {
    const res = await fetch('/api/v1/pages/me-dashboard', { credentials: 'include' });
    if (!res.ok) {
      // 404 is expected on backends that don't have the composite endpoint
      // wired yet; widgets will fall back to their own fetches. Anything
      // else is a real error worth surfacing in devtools.
      if (res.status !== 404) {
        error = `HTTP ${res.status}`;
      }
      return null;
    }
    const body = (await res.json()) as { data?: MeDashboardPayload };
    cached = body.data ?? null;
    fetchedAt = Date.now();
    return cached;
  } catch (err) {
    error = err instanceof Error ? err.message : 'unknown';
    return null;
  } finally {
    loading = false;
  }
}

export const meDashboard = {
  get data() {
    return cached;
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
  async load(force = false): Promise<MeDashboardPayload | null> {
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
