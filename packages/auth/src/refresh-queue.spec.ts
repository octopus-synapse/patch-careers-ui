import { afterEach, describe, expect, it, vi } from "vitest";
import { __resetRefreshQueue, isRefreshInFlight, refreshOnce } from "./refresh-queue";
import type { TokenPair } from "./types";

const samplePair: TokenPair = {
  accessToken: "access-1",
  refreshToken: "refresh-1",
  expiresIn: 3600,
};

afterEach(() => {
  __resetRefreshQueue();
});

describe("refresh-queue", () => {
  it("runs the underlying op exactly once for N concurrent callers", async () => {
    const op = vi.fn().mockImplementation(async () => {
      await new Promise<void>((r) => setTimeout(r, 5));
      return samplePair;
    });

    const callers = Array.from({ length: 8 }, () => refreshOnce(op));
    const results = await Promise.all(callers);

    expect(op).toHaveBeenCalledTimes(1);
    for (const r of results) {
      expect(r).toEqual(samplePair);
    }
  });

  it("clears the in-flight slot after success so a later call can re-fire", async () => {
    const op = vi.fn().mockResolvedValue(samplePair);

    await refreshOnce(op);
    await refreshOnce(op);
    await refreshOnce(op);

    expect(op).toHaveBeenCalledTimes(3);
    expect(isRefreshInFlight()).toBe(false);
  });

  it("clears the in-flight slot after failure so a later call can retry", async () => {
    const failingOp = vi.fn().mockRejectedValue(new Error("network"));

    await expect(refreshOnce(failingOp)).rejects.toThrow("network");
    expect(isRefreshInFlight()).toBe(false);

    // Second call must invoke the op anew rather than returning a cached
    // rejected Promise.
    const ok = vi.fn().mockResolvedValue(samplePair);
    await expect(refreshOnce(ok)).resolves.toEqual(samplePair);
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it("forwards a rejection to every awaiter on a concurrent batch", async () => {
    const failingOp = vi.fn().mockImplementation(async () => {
      await new Promise<void>((r) => setTimeout(r, 5));
      throw new Error("nope");
    });

    const callers = Array.from({ length: 4 }, () =>
      refreshOnce(failingOp).then(
        (v) => ({ ok: true as const, v }),
        (e: Error) => ({ ok: false as const, e }),
      ),
    );
    const results = await Promise.all(callers);

    expect(failingOp).toHaveBeenCalledTimes(1);
    for (const r of results) {
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.e.message).toBe("nope");
    }
  });

  it("isRefreshInFlight tracks the singleton lifecycle", async () => {
    let resolveOp: (p: TokenPair) => void = () => undefined;
    const op = vi.fn().mockImplementation(
      () =>
        new Promise<TokenPair>((r) => {
          resolveOp = r;
        }),
    );

    const pending = refreshOnce(op);
    expect(isRefreshInFlight()).toBe(true);
    resolveOp(samplePair);
    await pending;
    expect(isRefreshInFlight()).toBe(false);
  });
});
