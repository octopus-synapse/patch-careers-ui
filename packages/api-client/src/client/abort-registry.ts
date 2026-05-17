// Default AbortController per in-flight request.
//
// TanStack Query passes its own AbortSignal to the query function (see the
// kubb-generated hooks: `signal: config.signal ?? signal`), so reactive
// queries already cancel on navigation. Imperative SDK callers (analytics
// pings, one-shot getV1* calls outside React/Svelte Query) historically
// had no way to cancel — a tab close or rapid retry stacked pending
// fetches that all came back to a stale handler.
//
// This registry attaches a default AbortController to any RequestConfig
// that arrives without an explicit `signal`. The controller is stored
// keyed by the config object (WeakMap so the entry GCs with the config)
// and exposed via `abort(config)` for callers that want to cancel a
// specific request later. The fetcher reads `getOrCreate(config).signal`
// before calling fetch.
//
// Callers that already pass an AbortSignal opt out: getOrCreate returns
// null in that case and the fetcher keeps using the caller-owned signal.

import type { RequestConfig } from './fetcher';

const REGISTRY = new WeakMap<object, AbortController>();

export function getOrCreateController(config: RequestConfig<unknown>): AbortController | null {
  if (config.signal) return null;
  const existing = REGISTRY.get(config);
  if (existing) return existing;
  const ctrl = new AbortController();
  REGISTRY.set(config, ctrl);
  return ctrl;
}

export function abort(config: RequestConfig<unknown>): void {
  const ctrl = REGISTRY.get(config);
  if (ctrl && !ctrl.signal.aborted) ctrl.abort();
}

export function _resetRegistryForTests(): void {
  // No-op: WeakMap can't be enumerated. Re-use a fresh config object per
  // test to avoid leaking state between assertions.
}
