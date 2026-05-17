import { describe, expect, it } from 'vitest';
import { applyLangToChunk } from './hooks.server';

describe('applyLangToChunk', () => {
  it('replaces a single occurrence of %lang%', () => {
    expect(applyLangToChunk('<html lang="%lang%">', 'pt-BR')).toBe('<html lang="pt-BR">');
  });

  it('replaces ALL occurrences (regression for P1 #20: only first was swapped)', () => {
    const input = '<html lang="%lang%"><link hreflang="%lang%" href="/%lang%/x" />';
    expect(applyLangToChunk(input, 'en')).toBe(
      '<html lang="en"><link hreflang="en" href="/en/x" />',
    );
  });

  it('is a no-op when %lang% is absent', () => {
    expect(applyLangToChunk('<html lang="static">', 'pt-BR')).toBe('<html lang="static">');
  });
});
