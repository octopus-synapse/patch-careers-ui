import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import client, { setAcceptLanguageProvider } from '../fetcher';

const originalFetch = globalThis.fetch;
const originalDocument = (globalThis as { document?: unknown }).document;

function captureHeaders(): { last?: Headers } {
  const cap: { last?: Headers } = {};
  globalThis.fetch = ((_url: string, init?: RequestInit) => {
    cap.last = new Headers(init?.headers ?? {});
    return Promise.resolve(new Response('{}', { status: 200 }));
  }) as unknown as typeof fetch;
  return cap;
}

describe('Accept-Language provider', () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch;
    setAcceptLanguageProvider(() => undefined);
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    setAcceptLanguageProvider(() => undefined);
    if (originalDocument === undefined) {
      delete (globalThis as { document?: unknown }).document;
    } else {
      (globalThis as { document?: unknown }).document = originalDocument;
    }
  });

  it('reads Accept-Language from the injected provider', async () => {
    const cap = captureHeaders();
    setAcceptLanguageProvider(() => 'en');
    await client({ url: '/api/v1/anything' });
    expect(cap.last?.get('accept-language')).toBe('en');
  });

  it('falls back to pt-BR when the provider returns nothing', async () => {
    const cap = captureHeaders();
    setAcceptLanguageProvider(() => undefined);
    await client({ url: '/api/v1/anything' });
    expect(cap.last?.get('accept-language')).toBe('pt-BR');
  });

  it('does NOT touch document.cookie under SSR (no document defined)', async () => {
    delete (globalThis as { document?: unknown }).document;
    const cap = captureHeaders();
    setAcceptLanguageProvider(() => 'pt-BR');
    await client({ url: '/api/v1/anything' });
    expect(cap.last?.get('accept-language')).toBe('pt-BR');
  });
});
