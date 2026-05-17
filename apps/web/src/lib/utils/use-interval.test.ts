import { describe, expect, it } from 'vitest';

// Static contract test — useInterval is a $effect-bound rune helper that
// needs Svelte's runtime to instantiate, so we assert the public surface
// from a black-box perspective: it exports a single function with the
// (fn, delay) signature documented in the module.
import { useInterval } from './use-interval.svelte';

describe('useInterval', () => {
  it('is a function with arity 2', () => {
    expect(typeof useInterval).toBe('function');
    expect(useInterval.length).toBe(2);
  });
});
