import { describe, expect, it } from 'vitest';
import { sseReconnectDelay } from './use-sse-subscribe.svelte';

describe('sseReconnectDelay', () => {
  it('returns 0 for the very first retry (attempt=0) — transient blip self-heals (P1 #30)', () => {
    expect(sseReconnectDelay(0)).toBe(0);
  });

  it('grows exponentially from attempt=1', () => {
    expect(sseReconnectDelay(1)).toBe(1_000);
    expect(sseReconnectDelay(2)).toBe(2_000);
    expect(sseReconnectDelay(3)).toBe(4_000);
    expect(sseReconnectDelay(4)).toBe(8_000);
    expect(sseReconnectDelay(5)).toBe(16_000);
  });

  it('caps at 30s for the long tail', () => {
    expect(sseReconnectDelay(6)).toBe(30_000);
    expect(sseReconnectDelay(10)).toBe(30_000);
    expect(sseReconnectDelay(100)).toBe(30_000);
  });

  it("clamps negative inputs to 0 (defensive — caller bugs shouldn't loop fast)", () => {
    expect(sseReconnectDelay(-1)).toBe(0);
  });
});
