import { describe, expect, it } from 'vitest';
import { mapProfileLoadError } from './profile-loader-error-mapping';

const apiError = (statusCode: number, code = 'X') => ({
  code,
  message: `${code} ${statusCode}`,
  statusCode,
  severity: 'inline' as const,
});

describe('mapProfileLoadError (P1 #31)', () => {
  it('returns { profile: null } on 404 instead of throwing the SvelteKit error page', () => {
    expect(mapProfileLoadError(apiError(404, 'NOT_FOUND'))).toEqual({ profile: null });
  });

  it('throws 410 Gone for explicitly removed profiles', () => {
    expect(() => mapProfileLoadError(apiError(410, 'GONE'))).toThrow();
    try {
      mapProfileLoadError(apiError(410, 'GONE'));
    } catch (e) {
      expect((e as { status: number }).status).toBe(410);
    }
  });

  it('re-throws 401 (regression: privacy mask hid ingress misconfig)', () => {
    const e = apiError(401, 'UNAUTHORIZED');
    expect(() => mapProfileLoadError(e)).toThrow();
    try {
      mapProfileLoadError(e);
    } catch (caught) {
      expect(caught).toBe(e);
    }
  });

  it('re-throws 403 (same regression as 401)', () => {
    const e = apiError(403, 'FORBIDDEN');
    try {
      mapProfileLoadError(e);
      throw new Error('expected throw');
    } catch (caught) {
      expect(caught).toBe(e);
    }
  });

  it('re-throws 500 so SvelteKit renders the error boundary', () => {
    const e = apiError(500, 'INTERNAL');
    try {
      mapProfileLoadError(e);
      throw new Error('expected throw');
    } catch (caught) {
      expect(caught).toBe(e);
    }
  });

  it('re-throws non-ApiError values unchanged (network failures, plain Errors)', () => {
    const e = new Error('network died');
    try {
      mapProfileLoadError(e);
      throw new Error('expected throw');
    } catch (caught) {
      expect(caught).toBe(e);
    }
  });
});
