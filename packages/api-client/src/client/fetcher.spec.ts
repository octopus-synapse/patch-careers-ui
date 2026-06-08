import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetRefreshState,
  configureApiClient,
  type FetcherError,
  fetcher,
  resetApiClient,
} from "./fetcher";

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

beforeEach(() => {
  resetApiClient();
  __resetRefreshState();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("fetcher — success path", () => {
  it("serialises body, injects Bearer header, returns parsed JSON", async () => {
    const fetchMock: FetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { userId: "u1" }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    configureApiClient({
      baseURL: "https://api.example.com",
      getAuthHeader: () => "Bearer access-1",
    });

    const res = await fetcher<{ userId: string }>({
      method: "POST",
      url: "/v1/auth/login",
      data: { email: "a@b.c", password: "p" },
    });

    expect(res.data).toEqual({ userId: "u1" });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe("https://api.example.com/v1/auth/login");
    expect((calledInit.headers as Record<string, string>).Authorization).toBe("Bearer access-1");
    expect((calledInit.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    expect(calledInit.body).toBe(JSON.stringify({ email: "a@b.c", password: "p" }));
  });

  it("serialises array params with repeated keys", async () => {
    const fetchMock: FetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    configureApiClient({ baseURL: "https://api.example.com" });

    await fetcher({
      method: "GET",
      url: "/v1/things",
      params: { tag: ["a", "b"], limit: 10, skip: undefined, missing: null },
    });

    const [calledUrl] = fetchMock.mock.calls[0] as [string];
    expect(calledUrl).toBe("https://api.example.com/v1/things?tag=a&tag=b&limit=10");
  });

  it("injects Accept-Mode: tokens on native runtimes", async () => {
    const fetchMock: FetchMock = vi.fn().mockResolvedValue(emptyResponse(204));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    configureApiClient({
      baseURL: "https://api.example.com",
      forceNative: true,
    });

    await fetcher({ method: "GET", url: "/v1/me" });

    const [, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((calledInit.headers as Record<string, string>)["Accept-Mode"]).toBe("tokens");
  });

  it("does NOT inject Accept-Mode on web runtimes", async () => {
    const fetchMock: FetchMock = vi.fn().mockResolvedValue(emptyResponse(204));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    configureApiClient({
      baseURL: "https://api.example.com",
      forceNative: false,
    });

    await fetcher({ method: "GET", url: "/v1/me" });

    const [, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((calledInit.headers as Record<string, string>)["Accept-Mode"]).toBeUndefined();
  });
});

describe("fetcher — 401 refresh interceptor", () => {
  it("refreshes once on 401 then retries the original request with the new header", async () => {
    let firstAuthHeader: string | undefined;
    let retryAuthHeader: string | undefined;

    const fetchMock: FetchMock = vi
      .fn()
      .mockImplementationOnce(async (_url: string, init: RequestInit) => {
        firstAuthHeader = (init.headers as Record<string, string>).Authorization;
        return emptyResponse(401);
      })
      .mockImplementationOnce(async (_url: string, init: RequestInit) => {
        retryAuthHeader = (init.headers as Record<string, string>).Authorization;
        return jsonResponse(200, { ok: true });
      });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const refreshAuth = vi.fn().mockResolvedValue("Bearer access-2");
    configureApiClient({
      baseURL: "https://api.example.com",
      getAuthHeader: () => "Bearer access-1",
      refreshAuth,
    });

    const res = await fetcher<{ ok: boolean }>({
      method: "GET",
      url: "/v1/me",
    });

    expect(res.data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refreshAuth).toHaveBeenCalledTimes(1);
    expect(firstAuthHeader).toBe("Bearer access-1");
    expect(retryAuthHeader).toBe("Bearer access-2");
  });

  it("surfaces 401 when refresh callback fails", async () => {
    const fetchMock: FetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(401, { code: "AUTH.SESSION_EXPIRED" }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const refreshAuth = vi.fn().mockRejectedValue(new Error("refresh failed"));
    configureApiClient({
      baseURL: "https://api.example.com",
      getAuthHeader: () => "Bearer access-1",
      refreshAuth,
    });

    let err: FetcherError | null = null;
    try {
      await fetcher({ method: "GET", url: "/v1/me" });
    } catch (e) {
      err = e as FetcherError;
    }

    expect(err).not.toBeNull();
    expect(err?.status).toBe(401);
    expect((err?.response?.data as { code?: string }).code).toBe("AUTH.SESSION_EXPIRED");
    // Refresh attempted exactly once even on failure.
    expect(refreshAuth).toHaveBeenCalledTimes(1);
    // Fetch was NOT retried because refresh failed (returned null after catch).
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("cookie mode: retries after a successful refresh that returns no header", async () => {
    const fetchMock: FetchMock = vi
      .fn()
      .mockImplementationOnce(async () => emptyResponse(401))
      .mockImplementationOnce(async () => jsonResponse(200, { ok: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    // Cookie mode: refresh rolls the httpOnly cookie and returns null (no Bearer).
    const refreshAuth = vi.fn().mockResolvedValue(null);
    configureApiClient({
      baseURL: "https://api.example.com",
      getAuthHeader: null,
      refreshAuth,
      useCookies: true,
    });

    const res = await fetcher<{ ok: boolean }>({ method: "GET", url: "/v1/me" });

    expect(res.data).toEqual({ ok: true });
    expect(refreshAuth).toHaveBeenCalledTimes(1);
    // Retried even though refresh returned no header — the rolled cookie carries auth.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, retryInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(retryInit.credentials).toBe("include");
  });

  it("attaches credentials:'include' on every request in cookie mode", async () => {
    const fetchMock: FetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    configureApiClient({ baseURL: "https://api.example.com", useCookies: true });

    await fetcher({ method: "GET", url: "/v1/me" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe("include");
  });

  it("does not refresh when no refreshAuth is registered", async () => {
    const fetchMock: FetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(401, { code: "AUTH.UNAUTHENTICATED" }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    configureApiClient({
      baseURL: "https://api.example.com",
      getAuthHeader: () => null,
    });

    await expect(fetcher({ method: "GET", url: "/v1/me" })).rejects.toThrow(/HTTP 401/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("races: N concurrent 401s trigger exactly ONE refresh call", async () => {
    // First N calls all get 401. After refresh, subsequent calls succeed.
    const N = 5;
    let beforeRefreshCalls = 0;
    let afterRefreshCalls = 0;
    let refreshResolved = false;

    const fetchMock: FetchMock = vi.fn().mockImplementation(async () => {
      if (!refreshResolved) {
        beforeRefreshCalls++;
        return emptyResponse(401);
      }
      afterRefreshCalls++;
      return jsonResponse(200, { ok: true });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const refreshAuth = vi.fn().mockImplementation(async () => {
      // Yield a tick so concurrent callers can pile up on the singleton.
      await new Promise<void>((r) => setTimeout(r, 5));
      refreshResolved = true;
      return "Bearer access-2";
    });

    configureApiClient({
      baseURL: "https://api.example.com",
      getAuthHeader: () => "Bearer access-1",
      refreshAuth,
    });

    const results = await Promise.all(
      Array.from({ length: N }, () => fetcher<{ ok: boolean }>({ method: "GET", url: "/v1/me" })),
    );

    expect(results).toHaveLength(N);
    for (const r of results) {
      expect(r.data).toEqual({ ok: true });
    }
    // Critical: only ONE refresh fired even though N requests all 401'd.
    expect(refreshAuth).toHaveBeenCalledTimes(1);
    expect(beforeRefreshCalls).toBe(N);
    expect(afterRefreshCalls).toBe(N);
  });
});

describe("fetcher — error handling", () => {
  it("throws FetcherError with typed response body on non-2xx", async () => {
    const errorBody = { code: "VALIDATION_FAILED", details: ["email"] };
    const fetchMock: FetchMock = vi.fn().mockResolvedValue(jsonResponse(400, errorBody));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    configureApiClient({ baseURL: "https://api.example.com" });

    let err: FetcherError | null = null;
    try {
      await fetcher({ method: "POST", url: "/v1/users", data: {} });
    } catch (e) {
      err = e as FetcherError;
    }

    expect(err).not.toBeNull();
    expect(err?.status).toBe(400);
    expect(err?.response?.data).toEqual(errorBody);
  });

  it("returns undefined data on 204 No Content", async () => {
    const fetchMock: FetchMock = vi.fn().mockResolvedValue(emptyResponse(204));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    configureApiClient({ baseURL: "https://api.example.com" });

    const res = await fetcher({ method: "DELETE", url: "/v1/things/1" });
    expect(res.data).toBeUndefined();
    expect(res.status).toBe(204);
  });
});
