/**
 * multi-user-session test helper
 *
 * Lets a vitest spec impersonate a sequence of users on the same
 * "browser" instance without leaking state across them. Each call to
 * `withUserContext` runs the callback inside a fresh `$effect.root`
 * with a deterministic user id, then tears down the effect tree and
 * wipes that user's secure-storage namespace before returning.
 *
 * Usage:
 *   const dataA = await withUserContext('user-a', async () => {
 *     const store = createMeDashboardStore();
 *     await store.load();
 *     return store.data;
 *   });
 */

import { clearForUser } from '$lib/utils/secure-storage.svelte';

let currentUserId: string | undefined;

export function getMockUserId(): string | undefined {
  return currentUserId;
}

export async function withUserContext<T>(
  userId: string | undefined,
  fn: () => T | Promise<T>,
  options: { wipeOnExit?: boolean } = {},
): Promise<T> {
  const wipeOnExit = options.wipeOnExit ?? true;
  const previous = currentUserId;
  currentUserId = userId;
  let cleanup: (() => void) | undefined;
  try {
    let out!: T | Promise<T>;
    cleanup = $effect.root(() => {
      out = fn();
    });
    return await out;
  } finally {
    cleanup?.();
    if (wipeOnExit) clearForUser(userId);
    currentUserId = previous;
  }
}
