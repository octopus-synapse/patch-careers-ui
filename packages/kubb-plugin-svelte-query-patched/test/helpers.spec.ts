import { describe, expect, test } from 'bun:test';
import { buildPathParamTypeOverride } from '../src/components/Query.tsx';

describe('buildPathParamTypeOverride', () => {
  test('off: widens with `| undefined` only (matches upstream behavior)', () => {
    const override = buildPathParamTypeOverride(false);
    const result = override({ type: 'string', name: 'jobId' });
    expect(result.type).toBe('string | undefined');
    expect(result.name).toBe('jobId');
  });

  test('on: widens with getter form `T | (() => T | undefined) | undefined`', () => {
    const override = buildPathParamTypeOverride(true);
    const result = override({ type: 'string', name: 'jobId' });
    expect(result.type).toBe('string | (() => string | undefined) | undefined');
  });

  test('on: preserves complex types in both positions of the union', () => {
    const override = buildPathParamTypeOverride(true);
    const result = override({ type: "'a' | 'b'", name: 'kind' });
    expect(result.type).toBe("'a' | 'b' | (() => 'a' | 'b' | undefined) | undefined");
  });

  test('keeps other item properties intact', () => {
    const override = buildPathParamTypeOverride(true);
    const result = override({ type: 'number', name: 'id', optional: true });
    expect(result.optional).toBe(true);
    expect(result.name).toBe('id');
  });
});
