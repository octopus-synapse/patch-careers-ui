import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { abort, getOrCreateController } from '../abort-registry';
import client from '../fetcher';

const originalFetch = globalThis.fetch;

describe('abort-registry', () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns null when caller already supplied a signal', () => {
    const ctrl = new AbortController();
    const got = getOrCreateController({ signal: ctrl.signal });
    expect(got).toBeNull();
  });

  it('memoises the controller per config object', () => {
    const config = { url: '/x' };
    const a = getOrCreateController(config);
    const b = getOrCreateController(config);
    expect(a).not.toBeNull();
    expect(a).toBe(b);
  });

  it('aborts a request when abort(config) is called mid-flight', async () => {
    globalThis.fetch = ((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        if (!signal) throw new Error('test expected a signal');
        signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    }) as unknown as typeof fetch;

    const config = { url: '/api/v1/anything' };
    const pending = client(config);
    abort(config);
    await expect(pending).rejects.toThrow('aborted');
  });

  it('still respects caller-supplied signal (no double-binding)', async () => {
    let receivedSignal: AbortSignal | undefined;
    globalThis.fetch = ((_url: string, init?: RequestInit) => {
      receivedSignal = init?.signal ?? undefined;
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as unknown as typeof fetch;

    const callerCtrl = new AbortController();
    await client({ url: '/api/v1/anything', signal: callerCtrl.signal });
    expect(receivedSignal).toBe(callerCtrl.signal);
  });
});
