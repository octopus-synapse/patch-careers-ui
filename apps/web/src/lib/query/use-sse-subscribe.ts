import type { QueryClient, QueryKey } from '@tanstack/svelte-query';
import { getBaseUrl } from 'api-client';

type Options<T> = {
  queryClient: QueryClient;
  /** Query keys to invalidate whenever an event arrives. */
  invalidateKeys?: QueryKey[];
  /** Called with parsed JSON payload for each event. */
  onEvent?: (payload: T) => void;
  /** Named event types to listen for (defaults to generic `message`). */
  eventTypes?: string[];
  /** Enable/disable at runtime — e.g. only when user is authenticated. */
  enabled?: boolean;
};

/**
 * Opens an SSE connection to `path` (relative to the API base URL) and keeps it
 * alive with exponential-backoff reconnect. Invalidates the given query keys on
 * every event so TanStack Query refetches the affected data.
 *
 * Must be called inside a Svelte component `<script>` (relies on `$effect`).
 *
 * ```svelte
 * <script>
 *   import { useQueryClient } from '@tanstack/svelte-query';
 *   import { useSseSubscribe } from '$lib/query/use-sse-subscribe';
 *   const qc = useQueryClient();
 *   useSseSubscribe('/v1/notifications/subscribe', {
 *     queryClient: qc,
 *     invalidateKeys: [getNotificationsGetByUserQueryKey()],
 *   });
 * </script>
 * ```
 */
export function useSseSubscribe<T = unknown>(path: string, opts: Options<T>): void {
  $effect(() => {
    if (opts.enabled === false) return;
    if (typeof EventSource === 'undefined') return;

    const url = path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let closed = false;

    const connect = () => {
      if (closed) return;
      source = new EventSource(url, { withCredentials: true });

      const handle = (e: MessageEvent) => {
        attempt = 0;
        let payload: T;
        try {
          payload = JSON.parse(e.data) as T;
        } catch {
          return;
        }
        opts.onEvent?.(payload);
        opts.invalidateKeys?.forEach((key) => {
          opts.queryClient.invalidateQueries({ queryKey: key });
        });
      };

      if (opts.eventTypes?.length) {
        for (const type of opts.eventTypes) {
          source?.addEventListener(type, handle);
        }
      } else {
        source.onmessage = handle;
      }

      source.onerror = () => {
        source?.close();
        source = null;
        if (closed) return;
        attempt += 1;
        const delay = Math.min(30_000, 1000 * 2 ** attempt);
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
      source = null;
    };
  });
}
