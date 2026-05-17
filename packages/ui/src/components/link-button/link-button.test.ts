import { describe, expect, it } from 'bun:test';
import { getButtonClasses } from '../button/button.intents';

describe('LinkButton (class composition)', () => {
  it('reuses Button class composition for href-anchor mode', () => {
    const cls = getButtonClasses('solid', 'neutral', 'md', false, false, '', 'upper');
    expect(cls).toMatch(/inline-flex/);
    expect(cls).toMatch(/font-bold/);
  });

  it('keeps typography variants intact in textCase=normal', () => {
    const upper = getButtonClasses('solid', 'neutral', 'md', false, false, '', 'upper');
    const normal = getButtonClasses('solid', 'neutral', 'md', false, false, '', 'normal');
    expect(upper).toMatch(/uppercase/);
    expect(normal).not.toMatch(/\buppercase\b/);
  });
});
