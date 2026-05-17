import { describe, expect, it } from 'bun:test';
import { isLocale } from './config';

describe('isLocale', () => {
  it('returns true for supported locales', () => {
    expect(isLocale('pt-BR')).toBe(true);
    expect(isLocale('en')).toBe(true);
  });

  it('returns false for unsupported strings', () => {
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('en-GB')).toBe(false);
    expect(isLocale('')).toBe(false);
  });

  it('returns false for null / undefined without throwing (P1 #21)', () => {
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
