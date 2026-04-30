import { pagesMeDashboard } from 'api-client';
import { browser } from '$app/environment';

/**
 * Server-driven payload for the dashboard page.
 *
 * Backend endpoint: GET /api/v1/pages/me-dashboard (controller in
 * profile-services: bounded-contexts/platform/ui-metadata/controllers/
 * me-dashboard.controller.ts).
 *
 * The composite collapses what was N parallel widget fetches (resumes,
 * applications, notifications, viewer summary, recent activity) into a single
 * widget envelope. The frontend is intentionally dumb here: each widget is
 * an opaque `{ id, type, title, size, data, actions?, cta? }` and the page
 * dispatches by `type` to a local component map. Unknown types render the
 * `<UnsupportedWidget>` skeleton — no per-type translations or fallbacks.
 */
export type WidgetSize = 'sm' | 'md' | 'lg' | 'full' | string;

export interface DashboardWidgetCta {
  label: string;
  href?: string;
  intent?: string;
}

export interface DashboardWidgetAction {
  id: string;
  label: string;
  href?: string;
  intent?: string;
}

export interface DashboardWidget {
  id: string;
  type: string;
  title?: string;
  size?: WidgetSize;
  data?: unknown;
  actions?: DashboardWidgetAction[];
  cta?: DashboardWidgetCta;
}

export interface MeDashboardPayload {
  widgets: DashboardWidget[];
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
    // The generated SDK types `pagesMeDashboard` as returning `{ data: void }`
    // because the swagger spec hasn't shipped a schema for the composite.
    // We trust the runtime envelope and assert here — once the backend
    // publishes a schema, orval will tighten this automatically.
    const res = (await pagesMeDashboard()) as unknown as MeDashboardPayload | null;
    cached = res ?? null;
    fetchedAt = Date.now();
    return cached;
  } catch (err) {
    // 404 is expected on backends that don't have the composite endpoint
    // wired yet; widgets fall back to their own per-widget fetches.
    const status = (err as { statusCode?: number } | null)?.statusCode;
    if (status !== undefined && status !== 404) {
      error = `HTTP ${status}`;
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
  get widgets(): DashboardWidget[] {
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
