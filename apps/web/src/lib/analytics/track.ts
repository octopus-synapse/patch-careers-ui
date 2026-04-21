import { getBaseUrl } from 'api-client';
import { consentStore } from '$lib/state/consent-store.svelte';

type EventProps = Record<string, unknown>;
type QueuedEvent = { event: string; props?: EventProps; occurredAt: string };

const FLUSH_BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 5000;

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let disabled = false;
let unloadHookInstalled = false;

function scheduleFlush() {
  if (flushTimer || disabled) return;
  flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
}

async function flush(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0 || disabled) return;

  const batch = queue;
  queue = [];

  try {
    const response = await fetch(`${getBaseUrl()}/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });

    if (response.status === 404 || response.status === 501) {
      disabled = true;
    }
  } catch {
    /* drop on network error — analytics must never break the UI */
  }
}

/** Best-effort sync flush via sendBeacon when the page is leaving. */
function flushBeacon(): void {
  if (queue.length === 0 || disabled) return;
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
  const batch = queue;
  queue = [];
  try {
    const blob = new Blob([JSON.stringify({ events: batch })], { type: 'application/json' });
    navigator.sendBeacon(`${getBaseUrl()}/v1/events`, blob);
  } catch {
    /* swallow */
  }
}

function installUnloadHook(): void {
  if (unloadHookInstalled || typeof window === 'undefined') return;
  unloadHookInstalled = true;
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushBeacon();
  });
  window.addEventListener('pagehide', flushBeacon);
}

/**
 * Record a product event. Events are batched and flushed every 5s or when the
 * queue reaches 50 entries. If the backend returns 404/501, tracking is
 * silently disabled for the rest of the session. Pending events are flushed
 * via `sendBeacon` on tab close.
 */
export function track(event: string, props?: EventProps): void {
  if (disabled) return;
  // LGPD: no analytics tracking until the user explicitly opts in via the cookie banner.
  consentStore.hydrate();
  if (!consentStore.analytics) return;
  installUnloadHook();
  queue.push({ event, props, occurredAt: new Date().toISOString() });
  if (queue.length >= FLUSH_BATCH_SIZE) {
    void flush();
  } else {
    scheduleFlush();
  }
}

/** Force-flush the queue immediately (e.g. on route change or page unload). */
export function flushTrack(): Promise<void> {
  return flush();
}
