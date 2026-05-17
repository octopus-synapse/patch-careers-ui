import { describe, expect, it } from 'vitest';
import { parseAcceptLanguage } from './accept-language';

describe('parseAcceptLanguage', () => {
  it('returns [] for empty header', () => {
    expect(parseAcceptLanguage('')).toEqual([]);
  });

  it('parses a single tag with default quality 1', () => {
    expect(parseAcceptLanguage('pt-BR')).toEqual([{ tag: 'pt-BR', quality: 1 }]);
  });

  it('parses comma-separated tags without q in original order', () => {
    expect(parseAcceptLanguage('en, pt-BR, fr')).toEqual([
      { tag: 'en', quality: 1 },
      { tag: 'pt-BR', quality: 1 },
      { tag: 'fr', quality: 1 },
    ]);
  });

  it('honours q-values and re-sorts by quality desc', () => {
    expect(parseAcceptLanguage('pt-BR;q=0.1, en;q=0.9')).toEqual([
      { tag: 'en', quality: 0.9 },
      { tag: 'pt-BR', quality: 0.1 },
    ]);
  });

  it('keeps original order for equal-quality entries', () => {
    expect(parseAcceptLanguage('fr;q=0.5, en;q=0.5, de;q=0.5')).toEqual([
      { tag: 'fr', quality: 0.5 },
      { tag: 'en', quality: 0.5 },
      { tag: 'de', quality: 0.5 },
    ]);
  });

  it('drops entries with q=0 (caller explicitly excluded the locale)', () => {
    expect(parseAcceptLanguage('en;q=0, pt-BR;q=1')).toEqual([{ tag: 'pt-BR', quality: 1 }]);
  });

  it('rejects malformed q-values (NaN, >1, <0) and treats as no preference (q=1)', () => {
    expect(parseAcceptLanguage('en;q=abc')).toEqual([{ tag: 'en', quality: 1 }]);
    expect(parseAcceptLanguage('en;q=2')).toEqual([{ tag: 'en', quality: 1 }]);
    expect(parseAcceptLanguage('en;q=-0.5')).toEqual([{ tag: 'en', quality: 1 }]);
  });

  it('handles mixed weight + bare entries in one header', () => {
    expect(parseAcceptLanguage('pt-BR, en;q=0.5, *;q=0.1')).toEqual([
      { tag: 'pt-BR', quality: 1 },
      { tag: 'en', quality: 0.5 },
      { tag: '*', quality: 0.1 },
    ]);
  });
});
