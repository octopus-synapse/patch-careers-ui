import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import client, { isApiError } from '../fetcher';

const originalFetch = globalThis.fetch;

function mockResponse(status: number, body: string | object, contentType = 'application/json') {
  const bodyText = typeof body === 'string' ? body : JSON.stringify(body);
  globalThis.fetch = (async () =>
    new Response(bodyText, {
      status,
      headers: { 'content-type': contentType },
    })) as unknown as typeof fetch;
}

describe('fetcher error mapping', () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('preserves statusCode when the error body is not valid JSON', async () => {
    mockResponse(401, '<html>not json</html>', 'text/html');
    try {
      await client({ url: '/api/v1/anything' });
      throw new Error('expected fetcher to throw');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) {
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe('PARSE_ERROR');
      }
    }
  });

  it('uses status as statusCode when body has no statusCode field', async () => {
    mockResponse(500, { code: 'BOOM', message: 'kaboom' });
    try {
      await client({ url: '/api/v1/anything' });
      throw new Error('expected fetcher to throw');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) {
        expect(err.statusCode).toBe(500);
        expect(err.code).toBe('BOOM');
      }
    }
  });

  it('prefers body.statusCode when present', async () => {
    mockResponse(422, { code: 'X', message: 'y', statusCode: 422 });
    try {
      await client({ url: '/api/v1/anything' });
      throw new Error('expected fetcher to throw');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) {
        expect(err.statusCode).toBe(422);
      }
    }
  });
});
