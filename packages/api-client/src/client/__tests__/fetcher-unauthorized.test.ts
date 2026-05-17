import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import client, { setUnauthorizedHandler } from '../fetcher';

const originalFetch = globalThis.fetch;

function mockResponse(status: number, body: string | object, contentType = 'application/json') {
  const bodyText = typeof body === 'string' ? body : JSON.stringify(body);
  globalThis.fetch = (async () =>
    new Response(bodyText, {
      status,
      headers: { 'content-type': contentType },
    })) as unknown as typeof fetch;
}

describe('fetcher unauthorized handler', () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    setUnauthorizedHandler(null);
  });

  it('fires the registered handler once on 401', async () => {
    mockResponse(401, { code: 'UNAUTH', message: 'no', statusCode: 401 });
    let calls = 0;
    setUnauthorizedHandler(() => {
      calls++;
    });
    try {
      await client({ url: '/api/v1/anything' });
    } catch {
      // expected throw
    }
    expect(calls).toBe(1);
  });

  it('does not fire on non-401 errors', async () => {
    mockResponse(500, { code: 'BOOM', message: 'kaboom', statusCode: 500 });
    let calls = 0;
    setUnauthorizedHandler(() => {
      calls++;
    });
    try {
      await client({ url: '/api/v1/anything' });
    } catch {
      // expected throw
    }
    expect(calls).toBe(0);
  });

  it('swallows handler exceptions so the upstream error path still runs', async () => {
    mockResponse(401, { code: 'UNAUTH', message: 'no', statusCode: 401 });
    setUnauthorizedHandler(() => {
      throw new Error('handler boom');
    });
    let threw = false;
    try {
      await client({ url: '/api/v1/anything' });
    } catch (err) {
      threw = true;
      expect((err as { statusCode: number }).statusCode).toBe(401);
    }
    expect(threw).toBe(true);
  });

  it('does not fire when no handler is registered', async () => {
    mockResponse(401, { code: 'UNAUTH', message: 'no', statusCode: 401 });
    // No handler. The fetcher should still throw the 401 cleanly.
    let threw = false;
    try {
      await client({ url: '/api/v1/anything' });
    } catch (err) {
      threw = true;
      expect((err as { statusCode: number }).statusCode).toBe(401);
    }
    expect(threw).toBe(true);
  });
});
