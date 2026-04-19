/**
 * Shared in-memory tracker for connection requests just sent in this session.
 * Used by suggestion widgets so the same user shows "Sent" across every
 * instance until the next refetch lands.
 *
 * Ephemeral by design — the source of truth is the server (`isConnected`
 * pendingSentConnectionId on the profile, suggestions invalidation removes
 * the user from the list).
 */
let ids = $state(new Set<string>());

export const sentConnections = {
  has(userId: string): boolean {
    return ids.has(userId);
  },
  add(userId: string): void {
    if (ids.has(userId)) return;
    const next = new Set(ids);
    next.add(userId);
    ids = next;
  },
  remove(userId: string): void {
    if (!ids.has(userId)) return;
    const next = new Set(ids);
    next.delete(userId);
    ids = next;
  },
};
