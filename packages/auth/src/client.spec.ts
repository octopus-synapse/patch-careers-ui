import { __resetRefreshState, resetApiClient } from "@patch-careers/api-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "./auth.store";
import {
  bootstrap,
  configureAuthClient,
  login,
  logout,
  refresh,
  resetAuthClient,
  verifyTwoFactor,
} from "./client";
import { __resetRefreshQueue } from "./refresh-queue";
import { createMemoryStorage } from "./test-helpers";
import { createTokenStorage } from "./token-storage";

type FetchMock = ReturnType<typeof vi.fn>;
const originalFetch = globalThis.fetch;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

const API = "https://api.example.com";

beforeEach(() => {
  resetApiClient();
  __resetRefreshState();
  __resetRefreshQueue();
  resetAuthClient();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("client — configuration guard", () => {
  it("throws if login is called before configureAuthClient", async () => {
    await expect(login("a@b.c", "p")).rejects.toThrow(/configureAuthClient/);
  });
});

describe("client — login", () => {
  it("persists Bearer pair + flips store to authenticated on success", async () => {
    const storage = createMemoryStorage();
    const fetchMock: FetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        userId: "u-1",
        twoFactorRequired: false,
        accessToken: "access-1",
        refreshToken: "refresh-1",
        expiresIn: 3600,
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    configureAuthClient({ storage, apiBaseURL: API });
    const result = await login("a@b.c", "secret");

    expect(result.userId).toBe("u-1");
    expect(result.twoFactorRequired).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);

    const ts = createTokenStorage(storage);
    const pair = await ts.get();
    expect(pair?.accessToken).toBe("access-1");
    expect(pair?.refreshToken).toBe("refresh-1");
  });

  it("flags twoFactorRequired when backend gates the session", async () => {
    const storage = createMemoryStorage();
    const fetchMock: FetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { userId: "u-1", twoFactorRequired: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    configureAuthClient({ storage, apiBaseURL: API });
    const result = await login("a@b.c", "secret");
    expect(result.twoFactorRequired).toBe(true);

    const ts = createTokenStorage(storage);
    expect(await ts.get()).toBeNull();
  });

  it("clears the loading flag even when login throws", async () => {
    const storage = createMemoryStorage();
    const fetchMock: FetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(400, { code: "VALIDATION_FAILED" }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    configureAuthClient({ storage, apiBaseURL: API });
    await expect(login("a@b.c", "secret")).rejects.toThrow();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});

describe("client — verifyTwoFactor", () => {
  it("persists Bearer pair on 2FA success", async () => {
    const storage = createMemoryStorage();
    const fetchMock: FetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        userId: "u-1",
        accessToken: "access-2",
        refreshToken: "refresh-2",
        expiresIn: 3600,
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    configureAuthClient({ storage, apiBaseURL: API });
    const result = await verifyTwoFactor("u-1", "123456");
    expect(result.userId).toBe("u-1");
    expect(result.twoFactorRequired).toBe(false);

    const ts = createTokenStorage(storage);
    const pair = await ts.get();
    expect(pair?.accessToken).toBe("access-2");
  });
});

describe("client — refresh", () => {
  it("rotates the Bearer pair and persists the new tokens", async () => {
    const storage = createMemoryStorage();
    const ts = createTokenStorage(storage);
    await ts.set({
      accessToken: "old-access",
      refreshToken: "old-refresh",
      expiresIn: 60,
    });

    const fetchMock: FetchMock = vi
      .fn()
      .mockImplementation(async (_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string);
        expect(body.refreshToken).toBe("old-refresh");
        return jsonResponse(201, {
          mode: "tokens",
          accessToken: "new-access",
          refreshToken: "new-refresh",
          expiresIn: 7200,
        });
      });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    configureAuthClient({ storage, apiBaseURL: API });
    const pair = await refresh();
    expect(pair.accessToken).toBe("new-access");
    expect(pair.refreshToken).toBe("new-refresh");

    const persisted = await ts.get();
    expect(persisted?.accessToken).toBe("new-access");
  });

  it("throws when no refresh token is in storage", async () => {
    const storage = createMemoryStorage();
    configureAuthClient({ storage, apiBaseURL: API });
    await expect(refresh()).rejects.toThrow(/NO_REFRESH_TOKEN/);
  });

  it("singleton: concurrent refresh calls hit /refresh exactly once", async () => {
    const storage = createMemoryStorage();
    const ts = createTokenStorage(storage);
    await ts.set({
      accessToken: "old-access",
      refreshToken: "old-refresh",
      expiresIn: 60,
    });

    const fetchMock: FetchMock = vi.fn().mockImplementation(async () => {
      await new Promise<void>((r) => setTimeout(r, 5));
      return jsonResponse(201, {
        mode: "tokens",
        accessToken: "new-access",
        refreshToken: "new-refresh",
        expiresIn: 3600,
      });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    configureAuthClient({ storage, apiBaseURL: API });
    const results = await Promise.all([refresh(), refresh(), refresh()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    for (const r of results) {
      expect(r.accessToken).toBe("new-access");
    }
  });
});

describe("client — logout", () => {
  it("calls /logout, clears tokens, and resets the store", async () => {
    const storage = createMemoryStorage();
    const ts = createTokenStorage(storage);
    await ts.set({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresIn: 60,
    });
    useAuthStore.getState().setUser({
      userId: "u-1",
      email: "a@b.c",
      name: "Alice",
      username: null,
      emailVerified: true,
      isAdmin: false,
      hasCompletedOnboarding: true,
      needsEmailVerification: false,
    });

    const fetchMock: FetchMock = vi.fn().mockResolvedValue(emptyResponse(204));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    configureAuthClient({ storage, apiBaseURL: API });
    await logout();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await ts.get()).toBeNull();
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("still clears local state when the network call fails", async () => {
    const storage = createMemoryStorage();
    const ts = createTokenStorage(storage);
    await ts.set({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresIn: 60,
    });

    const fetchMock: FetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    configureAuthClient({ storage, apiBaseURL: API });
    await logout();

    expect(await ts.get()).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe("client — bootstrap", () => {
  it("returns null and clears store when no tokens are persisted", async () => {
    const storage = createMemoryStorage();
    const fetchMock: FetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    configureAuthClient({ storage, apiBaseURL: API });

    const result = await bootstrap();
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it("hydrates the store from /session when tokens are valid", async () => {
    const storage = createMemoryStorage();
    const ts = createTokenStorage(storage);
    await ts.set({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresIn: 3600,
    });

    const fetchMock: FetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        user: {
          id: "u-1",
          email: "a@b.c",
          name: "Alice",
          username: "alice",
          emailVerified: true,
          isAdmin: false,
          hasCompletedOnboarding: true,
          needsEmailVerification: false,
        },
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    configureAuthClient({ storage, apiBaseURL: API });
    const user = await bootstrap();

    expect(user?.userId).toBe("u-1");
    expect(user?.email).toBe("a@b.c");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().currentUser?.userId).toBe("u-1");
  });

  it("clears stored tokens on 401 (session invalid) and returns null", async () => {
    const storage = createMemoryStorage();
    const ts = createTokenStorage(storage);
    await ts.set({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresIn: 3600,
    });

    // First call: /session 401. The fetcher will try the refresh interceptor
    // before surfacing — that calls /refresh which also 401's.
    const fetchMock: FetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { code: "AUTH.EXPIRED" }))
      .mockResolvedValueOnce(jsonResponse(401, { code: "AUTH.EXPIRED" }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    configureAuthClient({ storage, apiBaseURL: API });
    const result = await bootstrap();

    expect(result).toBeNull();
    expect(await ts.get()).toBeNull();
    expect(useAuthStore.getState().currentUser).toBeNull();
  });
});
