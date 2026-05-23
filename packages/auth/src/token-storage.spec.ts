import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryStorage } from "./test-helpers";
import { createTokenStorage, TOKEN_KEYS } from "./token-storage";

describe("token-storage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-23T12:00:00Z"));
  });

  it("returns null when no tokens are persisted", async () => {
    const storage = createMemoryStorage();
    const ts = createTokenStorage(storage);
    expect(await ts.get()).toBeNull();
  });

  it("returns null when only one of access/refresh is persisted (corrupt state)", async () => {
    const storage = createMemoryStorage();
    await storage.setItem(TOKEN_KEYS.accessToken, "abc");
    const ts = createTokenStorage(storage);
    expect(await ts.get()).toBeNull();
  });

  it("persists the triple and reconstitutes the absolute expiresAt", async () => {
    const storage = createMemoryStorage();
    const ts = createTokenStorage(storage);

    await ts.set({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresIn: 3600,
    });

    const now = Date.now();
    expect(await storage.getItem(TOKEN_KEYS.accessToken)).toBe("access-1");
    expect(await storage.getItem(TOKEN_KEYS.refreshToken)).toBe("refresh-1");
    expect(await storage.getItem(TOKEN_KEYS.expiresAt)).toBe(String(now + 3600 * 1000));

    const got = await ts.get();
    expect(got).not.toBeNull();
    expect(got?.accessToken).toBe("access-1");
    expect(got?.refreshToken).toBe("refresh-1");
    expect(got?.expiresAt).toBe(now + 3600 * 1000);
    expect(got?.expiresIn).toBe(3600);
  });

  it("recomputes expiresIn relative to the current clock when reading", async () => {
    const storage = createMemoryStorage();
    const ts = createTokenStorage(storage);

    await ts.set({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresIn: 60,
    });

    // Advance 30s — expiresIn on read should reflect what's left.
    vi.advanceTimersByTime(30_000);
    const got = await ts.get();
    expect(got?.expiresIn).toBe(30);
  });

  it("clamps a stale expiresAt to zero rather than going negative", async () => {
    const storage = createMemoryStorage();
    const ts = createTokenStorage(storage);

    await ts.set({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresIn: 60,
    });

    vi.advanceTimersByTime(120_000);
    const got = await ts.get();
    expect(got?.expiresIn).toBe(0);
  });

  it("clear() wipes all three keys", async () => {
    const storage = createMemoryStorage();
    const ts = createTokenStorage(storage);
    await ts.set({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresIn: 60,
    });
    await ts.clear();
    expect(await ts.get()).toBeNull();
    expect(storage.store.size).toBe(0);
  });
});
